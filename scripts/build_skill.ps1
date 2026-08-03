param(
    [Parameter(Mandatory = $false)]
    [string]$SkillDir,

    [Parameter(Mandatory = $false)]
    [string]$Out,

    [Parameter(Mandatory = $false)]
    [string]$GitHubDir,

    [Parameter(Mandatory = $false)]
    [string]$LocalOut,

    [Parameter(Mandatory = $false)]
    [ValidateSet('Both', 'Public', 'Local')]
    [string]$Edition = 'Both'
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $SkillDir) {
    $SkillDir = Split-Path -Parent $scriptRoot
}

$skill = (Resolve-Path -LiteralPath $SkillDir).Path
$workspace = Split-Path -Parent $skill
$releaseRoot = Join-Path $workspace 'release'
if (-not $Out) {
    $Out = Join-Path $releaseRoot 'github\seo-coach.skill'
}
if (-not $GitHubDir) {
    $GitHubDir = Join-Path $releaseRoot 'github\seo-coach'
}
if (-not $LocalOut) {
    $LocalOut = Join-Path $releaseRoot 'local\seo-coach-local-maintainer.zip'
}

$outPath = [IO.Path]::GetFullPath($Out)
$githubPath = [IO.Path]::GetFullPath($GitHubDir)
$localPath = [IO.Path]::GetFullPath($LocalOut)
$validator = Join-Path $skill 'scripts\validate_skill.py'
$privacyTest = Join-Path $skill 'scripts\test_privacy_firewall.py'
$routerTest = Join-Path $skill 'hooks\test_router.py'

python $validator $skill --require-evals
if ($LASTEXITCODE -ne 0) { throw 'Source validation failed.' }
python $privacyTest
if ($LASTEXITCODE -ne 0) { throw 'Privacy validation failed.' }
python $routerTest
if ($LASTEXITCODE -ne 0) { throw 'Router validation failed.' }

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('seo-coach-build-' + [guid]::NewGuid().ToString('N'))
$tempRootFull = [IO.Path]::GetFullPath($tempRoot)
$systemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
if (-not $tempRootFull.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing unsafe temporary path: $tempRootFull"
}

function Copy-EditionFiles {
    param(
        [string]$Destination,
        [string[]]$RootFiles,
        [string[]]$Directories
    )
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    foreach ($rootFile in $RootFiles) {
        $source = Join-Path $skill $rootFile
        if (Test-Path -LiteralPath $source) {
            Copy-Item -LiteralPath $source -Destination $Destination
        }
    }
    foreach ($dir in $Directories) {
        $source = Join-Path $skill $dir
        if (Test-Path -LiteralPath $source) {
            Copy-Item -LiteralPath $source -Destination $Destination -Recurse
        }
    }
}

function Remove-StagingNoise {
    param(
        [string]$Root,
        [switch]$Public
    )
    $rootFull = [IO.Path]::GetFullPath($Root)
    foreach ($cacheDir in @(Get-ChildItem -LiteralPath $rootFull -Recurse -Directory -Filter '__pycache__' -ErrorAction SilentlyContinue)) {
        $cacheFull = [IO.Path]::GetFullPath($cacheDir.FullName)
        if (-not $cacheFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing unsafe cache cleanup path: $cacheFull"
        }
        Remove-Item -LiteralPath $cacheFull -Recurse -Force
    }
    foreach ($pyc in @(Get-ChildItem -LiteralPath $rootFull -Recurse -File -Filter '*.pyc' -ErrorAction SilentlyContinue)) {
        Remove-Item -LiteralPath $pyc.FullName -Force
    }
    $runs = Join-Path $rootFull 'evals\runs'
    if (Test-Path -LiteralPath $runs) {
        Remove-Item -LiteralPath $runs -Recurse -Force
    }
    if ($Public) {
        $publicTest = Join-Path $rootFull 'hooks\test_router.py'
        if (Test-Path -LiteralPath $publicTest) {
            Remove-Item -LiteralPath $publicTest -Force
        }
    }
}

function Publish-File {
    param([string]$Source, [string]$Destination)
    $parent = Split-Path -Parent $Destination
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Move-Item -LiteralPath $Source -Destination $Destination -Force
}

function Publish-Directory {
    param([string]$Source, [string]$Destination)
    $releaseFull = [IO.Path]::GetFullPath($releaseRoot).TrimEnd('\') + '\'
    $destinationFull = [IO.Path]::GetFullPath($Destination)
    if (-not $destinationFull.StartsWith($releaseFull, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to replace a GitHub directory outside the release root: $destinationFull"
    }
    $parent = Split-Path -Parent $destinationFull
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    if (Test-Path -LiteralPath $destinationFull) {
        Remove-Item -LiteralPath $destinationFull -Recurse -Force
    }
    Move-Item -LiteralPath $Source -Destination $destinationFull
}

try {
    New-Item -ItemType Directory -Path $tempRootFull -Force | Out-Null

    if ($Edition -in @('Both', 'Public')) {
        $githubStage = Join-Path $tempRootFull 'github\seo-coach'
        Copy-EditionFiles -Destination $githubStage `
            -RootFiles @('.gitignore', 'README.md', 'README.en.md', 'README.zh-CN.md', 'CHANGELOG.md', 'SKILL.md', 'FAILSAFE.md') `
            -Directories @('agents', 'references', 'assets', 'adapters', 'hooks')
        Remove-StagingNoise -Root $githubStage -Public
        python $validator $githubStage
        if ($LASTEXITCODE -ne 0) { throw 'GitHub edition validation failed.' }

        $packageStage = Join-Path $tempRootFull 'package\seo-coach'
        Copy-EditionFiles -Destination $packageStage `
            -RootFiles @('SKILL.md', 'FAILSAFE.md') `
            -Directories @('agents', 'references', 'assets', 'adapters', 'hooks')
        Remove-StagingNoise -Root $packageStage -Public
        $tempPublicZip = Join-Path $tempRootFull 'seo-coach-public.zip'
        Compress-Archive -LiteralPath $packageStage -DestinationPath $tempPublicZip -CompressionLevel Optimal
        python $validator $skill --package $tempPublicZip
        if ($LASTEXITCODE -ne 0) { throw 'Public package parity validation failed.' }

        Publish-Directory -Source $githubStage -Destination $githubPath
        Publish-File -Source $tempPublicZip -Destination $outPath
        Write-Output "PASS: GitHub repo edition $githubPath"
        Write-Output "PASS: public skill package $outPath"
    }

    if ($Edition -in @('Both', 'Local')) {
        $localStage = Join-Path $tempRootFull 'local\seo-coach'
        Copy-EditionFiles -Destination $localStage `
            -RootFiles @('.gitignore', 'README.md', 'README.en.md', 'README.zh-CN.md', 'CHANGELOG.md', 'SKILL.md', 'FAILSAFE.md') `
            -Directories @('agents', 'references', 'assets', 'adapters', 'hooks', 'scripts', 'evals')
        Remove-StagingNoise -Root $localStage
        $privateNotice = Join-Path $localStage 'LOCAL-MAINTAINER-ONLY.txt'
        Set-Content -LiteralPath $privateNotice -Encoding UTF8 -Value @(
            'SEO Coach local maintainer edition.'
            'Contains release validation and evaluation infrastructure.'
            'Do not publish this archive; publish the generated GitHub edition instead.'
        )
        $tempLocalZip = Join-Path $tempRootFull 'seo-coach-local-maintainer.zip'
        Compress-Archive -LiteralPath $localStage -DestinationPath $tempLocalZip -CompressionLevel Optimal
        Publish-File -Source $tempLocalZip -Destination $localPath
        Write-Output "PASS: local maintainer edition $localPath"
    }
}
finally {
    if (Test-Path -LiteralPath $tempRootFull) {
        $resolved = (Resolve-Path -LiteralPath $tempRootFull).Path
        if (-not $resolved.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing unsafe cleanup path: $resolved"
        }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
