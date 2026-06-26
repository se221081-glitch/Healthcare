$root = 'C:\Users\Kingpin\Downloads\files 3\files'
$out = 'C:\Users\Kingpin\Downloads\files 3\healthtrack-deploy.zip'
$exclude = @('.git', '.vercel', '__MACOSX')
$items = Get-ChildItem -Path $root -Force | Where-Object { $_.Name -notin $exclude }
if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path $items.FullName -DestinationPath $out -Force
Write-Host $out
