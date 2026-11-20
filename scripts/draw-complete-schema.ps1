Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $root 'docs'
$width = 2600; $height = 3350
$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.TextRenderingHint = 'AntiAliasGridFit'
$pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(40,40,40), 2.5)
$black = [System.Drawing.Brushes]::Black
$fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235,235,235))
$svg = [System.Collections.Generic.List[string]]::new()
$svg.Add('<svg xmlns="http://www.w3.org/2000/svg" width="2600" height="3350" viewBox="0 0 2600 3350"><rect width="2600" height="3350" fill="white"/>')
function Label($text, $x, $y, $size=30, $bold=$false) {
    $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $font = [System.Drawing.Font]::new('Arial', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.DrawString($text, $font, $black, [single]$x, [single]$y)
    $weight = if ($bold) {'bold'} else {'normal'}
    $escaped = [System.Security.SecurityElement]::Escape($text)
    $svg.Add("<text x='$x' y='$($y + $size * .94)' font-family='Arial,sans-serif' font-size='$size' font-weight='$weight'>$escaped</text>")
    $font.Dispose()
}
function Line($points, $arrow=$false) {
    $drawingPoints = [System.Drawing.PointF[]]@($points | ForEach-Object { [System.Drawing.PointF]::new($_[0], $_[1]) })
    $graphics.DrawLines($pen, $drawingPoints)
    $coordinates = ($points | ForEach-Object { "$($_[0]),$($_[1])" }) -join ' '
    $svg.Add("<polyline points='$coordinates' fill='none' stroke='#282828' stroke-width='2.5'/>")
    if ($arrow) {
        $end = $points[-1]; $before = $points[-2]
        $dx = $end[0]-$before[0]; $dy = $end[1]-$before[1]
        $length = [Math]::Sqrt($dx*$dx+$dy*$dy); $dx /= $length; $dy /= $length
        $triangle = @($end, @(($end[0]-18*$dx+7*$dy),($end[1]-18*$dy-7*$dx)), @(($end[0]-18*$dx-7*$dy),($end[1]-18*$dy+7*$dx)))
        $graphics.FillPolygon($black, [System.Drawing.PointF[]]@($triangle | ForEach-Object {[System.Drawing.PointF]::new($_[0],$_[1])}))
        $coords = ($triangle | ForEach-Object {"$($_[0]),$($_[1])"}) -join ' '
        $svg.Add("<polygon points='$coords' fill='#282828'/>")
    }
}
function Relation($name, $x, $y, $fields) {
    Label $name $x ($y-49) 34 $true
    $ports = @{}
    foreach ($field in $fields) {
        $text = $field.TrimStart('*')
        $font = [System.Drawing.Font]::new('Arial',30,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
        $tw = $graphics.MeasureString($text,$font).Width
        $cellWidth = [Math]::Ceiling($tw+42)
        $graphics.FillRectangle($fill,[single]$x,[single]$y,[single]$cellWidth,68)
        $graphics.DrawRectangle($pen,[single]$x,[single]$y,[single]$cellWidth,68)
        $svg.Add("<rect x='$x' y='$y' width='$cellWidth' height='68' fill='#ebebeb' stroke='#282828' stroke-width='2.5'/>")
        Label $text ($x+21) ($y+16) 30
        if ($field.StartsWith('*')) { Line @(@(($x+21),($y+52)),@(($x+$cellWidth-21),($y+52))) }
        $ports[$text] = @(($x+$cellWidth/2),($y+68))
        $x += $cellWidth
        $font.Dispose()
    }
    return $ports
}
function Bus($x,$bottom,$parent,$track) {
    Line @(@($x,$bottom),@($x,$track),@($parent[0],$track),$parent) $true
}
function Branch($port,$bus,$track) {
    Line @($port,@($port[0],$track),@($bus,$track))
    $graphics.FillEllipse($black,[single]($bus-5),[single]($track-5),10,10)
    $svg.Add("<circle cx='$bus' cy='$track' r='5' fill='#282828'/>")
}
function Section($title,$y) {
    Label $title 100 $y 35 $true
    Line @(@(100,($y+57)),@(2300,($y+57)))
}
Label 'ScoutIQ | COMPLETE RELATIONAL SCHEMA' 90 50 52 $true
Label '12 application relations | All attributes and declared key constraints' 94 120 31
Label 'PK = primary key (underlined)    FK -> = references    UK = unique constraint    NULL = nullable foreign key' 94 175 27
$schema = Get-Content (Join-Path $root 'docs/RELATIONAL_SCHEMA.md') -Raw
$blocks = [regex]::Matches($schema, '(?ms)^([A-Z_]+)\(\r?\n(.*?)^\)')
$index = 0
foreach ($block in $blocks) {
    $name = $block.Groups[1].Value
    if ($name -eq 'SCHEMA_MIGRATIONS') { continue }
    $column = $index % 2; $row = [Math]::Floor($index / 2)
    $x = 90 + $column*1260; $y = 290 + $row*470
    $graphics.FillRectangle($fill,[single]$x,[single]$y,1160,65)
    $graphics.DrawRectangle($pen,[single]$x,[single]$y,1160,430)
    $svg.Add("<rect x='$x' y='$y' width='1160' height='430' fill='none' stroke='#282828' stroke-width='2.5'/><rect x='$x' y='$y' width='1160' height='65' fill='#ebebeb'/>")
    Label $name ($x+22) ($y+12) 34 $true
    $lineY = $y+88
    foreach ($entry in ($block.Groups[2].Value -split '\r?\n')) {
        $value = $entry.Trim().TrimEnd(',')
        if (!$value) {continue}
        Label $value ($x+26) $lineY 27
        if ($value -match '^(\w+) PK') {
            $font = [System.Drawing.Font]::new('Arial',27,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
            $pkWidth = $graphics.MeasureString($Matches[1],$font).Width-7
            Line @(@(($x+29),($lineY+31)),@(($x+29+$pkWidth),($lineY+31)))
            $font.Dispose()
        }
        $lineY += 42
    }
    $index++
}
Label 'Source: src/db/migrations/001-019. Photo and crest attributes include migration 016.' 94 3160 27
Label 'SCHEMA_MIGRATIONS(filename PK, applied_at) is migration bookkeeping and is excluded from the application relations.' 94 3210 25
Label 'Composite UK constraints are shown as UK(...); they do not replace the declared surrogate primary keys.' 94 3260 25
$svg.Add('</svg>')
$pngPath = Join-Path $destination 'RELATIONAL_SCHEMA_CORRECTED.png'
$svgPath = Join-Path $destination 'RELATIONAL_SCHEMA_CORRECTED.svg'
$bitmap.Save($pngPath,[System.Drawing.Imaging.ImageFormat]::Png)
[System.IO.File]::WriteAllLines($svgPath,$svg,[System.Text.UTF8Encoding]::new($false))
$graphics.Dispose(); $bitmap.Dispose(); $pen.Dispose(); $fill.Dispose()
Write-Output $pngPath
Write-Output $svgPath



