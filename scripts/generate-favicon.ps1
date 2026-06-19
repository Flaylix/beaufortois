Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\images\logo-beaufortois.png'
$outDir = Join-Path $PSScriptRoot '..\images\favicon'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$img = [System.Drawing.Image]::FromFile($src)

function Save-Size([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $size, $size)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Save-Size 16 (Join-Path $outDir 'favicon-16x16.png')
Save-Size 32 (Join-Path $outDir 'favicon-32x32.png')
Save-Size 180 (Join-Path $outDir 'apple-touch-icon.png')
Save-Size 192 (Join-Path $outDir 'android-chrome-192x192.png')

$rootFavicon = Join-Path $PSScriptRoot '..\favicon.png'
Copy-Item (Join-Path $outDir 'favicon-32x32.png') $rootFavicon -Force

$img.Dispose()
Write-Host 'Favicons generated in' $outDir
