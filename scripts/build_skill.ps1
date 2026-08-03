param(
    [Parameter(Mandatory = $false)]
    [string]$SkillDir = (Split-Path -Parent $PSScriptRoot),

    [Parameter(Mandatory = $false)]
    [string]$Out = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'seo-coach.skill')
)

$ErrorActionPreference = 'Stop'
$skill = (Resolve-Path -LiteralPath $SkillDir).Path
$outPath = [IO.Path]::GetFullPath($Out)
$validator = Join-Path $skill 'scripts\validate_skill.py'

python $validator $skill --require-evals
if ($LASTEXITCODE -ne 0) { throw 'Source validation failed.' }

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('seo-coach-build-' + [guid]::NewGuid().ToString('N'))
$tempRootFull = [IO.Path]::GetFullPath($tempRoot)
$systemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
if (-not $tempRootFull.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing unsafe temporary path: $tempRootFull"
}

$packageRoot = Join-Path $tempRootFull (Split-Path -Leaf $skill)
$tempZip = Join-Path $tempRootFull 'seo-coach.zip'

try {
    New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $skill 'SKILL.md') -Destination $packageRoot
    foreach ($dir in @('agents', 'references', 'scripts', 'assets', 'adapters', 'hooks')) {
        $source = Join-Path $skill $dir
        if (Test-Path -LiteralPath $source) {
            Copy-Item -LiteralPath $source -Destination $packageRoot -Recurse
        }
    }
    Compress-Archive -LiteralPath $packageRoot -DestinationPath $tempZip -CompressionLevel Optimal
    python $validator $skill --package $tempZip
    if ($LASTEXITCODE -ne 0) { throw 'Package parity validation failed.' }

    $outDir = Split-Path -Parent $outPath
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    Move-Item -LiteralPath $tempZip -Destination $outPath -Force
    Write-Output "PASS: built $outPath"
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
