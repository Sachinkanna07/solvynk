# Run only after copying a newly generated Solvynk Dev client secret from GitHub.
# Reads the clipboard in memory, writes outside the repository, then clears it.
$ErrorActionPreference = 'Stop'
$target = Join-Path $env:USERPROFILE '.config\solvynk\secrets\solvynk-dev.client-secret'
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'Prepared secret file missing' }
if ((Get-Item -LiteralPath $target).Length -ne 0) { throw 'Secret file already populated; refusing overwrite' }
$value = (Get-Clipboard -Raw).Trim()
if ($value -notmatch '^[A-Za-z0-9_]{20,200}$') { throw 'Clipboard does not contain a single plausible client secret' }
[IO.File]::WriteAllText($target, $value, [Text.UTF8Encoding]::new($false))
Set-Clipboard -Value ' '
Remove-Variable value
Write-Output 'Client secret saved outside the repository; clipboard cleared.'
