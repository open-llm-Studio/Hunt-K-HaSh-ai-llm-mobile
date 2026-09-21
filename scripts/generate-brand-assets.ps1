# Regenerates the Hunt-K-HaSh AI launcher icons and the onboarding artwork.
#
# The "HK" mark is drawn from the same geometry as the web app's
# hunt-k-hash-ai-icon.svg (a 64x64 viewBox), so both apps share one logo.
# The wordmark PNGs are copied from the web app instead of being redrawn.
#
# Usage (Windows PowerShell, from the repository root):
#   powershell -ExecutionPolicy Bypass -File scripts\generate-brand-assets.ps1 -WebRepo ..\anything-llm
param(
  [Parameter(Mandatory = $true)][string]$WebRepo
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$bg = [Drawing.Color]::FromArgb(255, 0x0E, 0x0E, 0x10)
$white = [Drawing.Color]::White

# Draws the HK strokes. $x0/$y0 is where the 64-unit viewBox starts and $unit
# is the pixel size of one viewBox unit.
function Draw-Mark($g, [double]$x0, [double]$y0, [double]$unit, $color) {
  $pen = New-Object Drawing.Pen $color, ([single](3.8 * $unit))
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
  $p = { param($x, $y) New-Object Drawing.PointF ([single]($x0 + $x * $unit)), ([single]($y0 + $y * $unit)) }
  $g.DrawLine($pen, (& $p 17 19), (& $p 17 45))
  $g.DrawLine($pen, (& $p 17 32), (& $p 30 32))
  $g.DrawLine($pen, (& $p 30 19), (& $p 30 45))
  $g.DrawLine($pen, (& $p 39 19), (& $p 39 45))
  $g.DrawLines($pen, [Drawing.PointF[]]@((& $p 49 19), (& $p 39 32), (& $p 49 45)))
  $pen.Dispose()
}

function New-Canvas([int]$size) {
  $b = New-Object Drawing.Bitmap $size, $size, ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([Drawing.Color]::Transparent)
  return $b, $g
}

function Fill-RoundRect($g, $brush, [double]$x, [double]$y, [double]$w, [double]$h, [double]$r) {
  $path = New-Object Drawing.Drawing2D.GraphicsPath
  $d = 2 * $r
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}

function Save($b, $g, [string]$path) {
  $g.Dispose(); $b.Save($path, [Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}

# Full icon: dark tile with the mark. $radius 0 gives a square (iOS masks it).
function Write-Icon([int]$size, [string]$path, [double]$radiusRatio) {
  $b, $g = New-Canvas $size
  $brush = New-Object Drawing.SolidBrush $bg
  if ($radiusRatio -gt 0) { Fill-RoundRect $g $brush 0 0 $size $size ($size * $radiusRatio) } else { $g.FillRectangle($brush, 0, 0, $size, $size) }
  $brush.Dispose()
  Draw-Mark $g 0 0 ($size / 64.0) $white
  Save $b $g $path
}

# --- Android launcher icons -------------------------------------------------
$densities = @{ mdpi = 1.0; hdpi = 1.5; xhdpi = 2.0; xxhdpi = 3.0; xxxhdpi = 4.0 }
foreach ($d in $densities.Keys) {
  $dir = Join-Path $root "android\app\src\main\res\mipmap-$d"
  $s = $densities[$d]

  Write-Icon ([int](48 * $s)) (Join-Path $dir 'ic_launcher.png') 0.25

  # Adaptive icon layers are 108dp; the launcher masks to the centre 72dp.
  $layer = [int](108 * $s)
  $unit = (72 * $s) / 64.0
  $offset = 18 * $s

  $b, $g = New-Canvas $layer
  $g.Clear($bg)
  Save $b $g (Join-Path $dir 'ic_launcher_background.png')

  foreach ($name in 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png') {
    $b, $g = New-Canvas $layer
    Draw-Mark $g $offset $offset $unit $white
    Save $b $g (Join-Path $dir $name)
  }
}

# --- iOS app icons ------------------------------------------------------------
$iosDir = Join-Path $root 'ios\HuntKHashAI\Images.xcassets\AppIcon.appiconset'
$contents = Get-Content (Join-Path $iosDir 'Contents.json') -Raw | ConvertFrom-Json
foreach ($img in $contents.images) {
  if (-not $img.filename) { continue }
  $pt = [double]($img.size -split 'x')[0]
  $scale = if ($img.scale) { [double]($img.scale -replace 'x', '') } else { 1.0 }   # the App Store entry has no scale
  Write-Icon ([int][Math]::Round($pt * $scale)) (Join-Path $iosDir $img.filename) 0
}

# --- In-app logos, copied from the web app ------------------------------------
$webLogo = Join-Path $WebRepo 'frontend\src\media\logo'
$appLogo = Join-Path $root 'src\assets\logo'
Copy-Item (Join-Path $webLogo 'hunt-k-hash-ai.png') (Join-Path $appLogo 'hunt-k-hash-ai.png') -Force
Copy-Item (Join-Path $webLogo 'hunt-k-hash-ai-dark.png') (Join-Path $appLogo 'hunt-k-hash-ai-dark.png') -Force
Copy-Item (Join-Path $webLogo 'hunt-k-hash-ai-icon.png') (Join-Path $appLogo 'hunt-k-hash-ai-icon.png') -Force
Copy-Item (Join-Path $webLogo 'hunt-k-hash-ai-infinity.png') (Join-Path $appLogo 'hunt-k-hash-ai-infinity.png') -Force

# --- Onboarding welcome illustration ------------------------------------------
# Keeps the globe artwork and swaps the mark at its centre for the HK mark.
$welcomePath = Join-Path $root 'src\assets\onboarding\welcome.png'
$src = [Drawing.Image]::FromFile($welcomePath)
$b = New-Object Drawing.Bitmap $src.Width, $src.Height, ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [Drawing.Graphics]::FromImage($b)
$g.SmoothingMode = 'AntiAlias'
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)
$src.Dispose()
$fill = $b.GetPixel(480, 770)          # the globe's own fill, just left of the old mark
$brush = New-Object Drawing.SolidBrush $fill
# SourceCopy so a translucent fill replaces the old mark instead of blending over it.
$g.CompositingMode = 'SourceCopy'
$g.FillRectangle($brush, 505, 690, 232, 162)
$g.CompositingMode = 'SourceOver'
$brush.Dispose()
Draw-Mark $g (621 - 100) (771 - 100) (200 / 64.0) $white
$g.Dispose()
$b.Save("$welcomePath.tmp", [Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
Move-Item "$welcomePath.tmp" $welcomePath -Force

Write-Output 'Brand assets regenerated.'
