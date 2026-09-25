$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$stageRoot = Join-Path $projectRoot ('.data/package-' + [guid]::NewGuid().ToString('N'))
$sourceStage = Join-Path $stageRoot 'noi-app'
New-Item -ItemType Directory -Path $sourceStage -Force | Out-Null
$include = @('src','supabase','scripts','tests','e2e','public','package.json','package-lock.json','tsconfig.json','next.config.ts','next-env.d.ts','playwright.config.ts','.env.example','.gitignore','AGENTS.md','README.md','HANDOVER.md','SOURCE_MAP.md','TASKS.md','VERIFICATION.md')
foreach ($item in $include) {
  $sourcePath = Join-Path $projectRoot $item
  if (Test-Path -LiteralPath $sourcePath) { Copy-Item -LiteralPath $sourcePath -Destination $sourceStage -Recurse }
}
$zipPath = Join-Path (Split-Path $projectRoot -Parent) ('NOI_demo_source_' + (Get-Date -Format 'yyyy-MM-dd_HHmmss') + '.zip')
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageRoot,$zipPath)
Write-Output $zipPath
# Remove only this verified temporary staging directory, never user data.
$resolvedStage = [System.IO.Path]::GetFullPath($stageRoot)
$allowedParent = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.data')) + [System.IO.Path]::DirectorySeparatorChar
if (-not $resolvedStage.StartsWith($allowedParent,[StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid staging path' }
if ((Split-Path $resolvedStage -Leaf) -notmatch '^package-[a-f0-9]{32}$') { throw 'Invalid staging name' }
Remove-Item -LiteralPath $resolvedStage -Recurse -Force
