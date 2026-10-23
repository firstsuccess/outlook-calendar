param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$source = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\dist'))
$target = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $target) { throw 'Choose a new destination. Existing directories are never overwritten.' }
if (!(Test-Path -LiteralPath (Join-Path $source 'index.html'))) { throw 'Run npm run build first.' }
New-Item -ItemType Directory -Path $target | Out-Null
Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse
Write-Host "Static files copied to $target. Configure your new HTTPS host separately. No IIS or service settings were changed."
