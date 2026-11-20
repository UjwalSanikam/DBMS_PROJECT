Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $root 'docs'
$width = 2600; $height = 4900
$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.TextRenderingHint = 'AntiAliasGridFit'
$pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(40,40,40), 2.5)
$black = [System.Drawing.Brushes]::Black
$fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235,235,235))
$svg = [System.Collections.Generic.List[string]]::new()
$svg.Add('<svg xmlns="http://www.w3.org/2000/svg" width="2600" height="4900" viewBox="0 0 2600 4900"><rect width="2600" height="4900" fill="white"/>')
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
Label 'ScoutIQ | RELATIONAL SCHEMA' 90 45 52 $true
Label 'Complete attributes and 17 foreign-key connections' 94 112 32
Label 'Arrows point from FK to PK. Primary keys are underlined; UK denotes a unique constraint.' 94 170 27
Label 'Arrow colours: PLAYER = blue   CLUB = green   LEAGUE = purple   USER = brown' 94 215 27
$schema = Get-Content (Join-Path $root 'docs/RELATIONAL_SCHEMA.md') -Raw
$blocks = [regex]::Matches($schema, '(?ms)^([A-Z_]+)\(\r?\n(.*?)^\)')
$cards = @{}; $connections = @(); $y = 300; $x = 690
foreach ($block in $blocks) {
    $name = $block.Groups[1].Value
    if ($name -eq 'SCHEMA_MIGRATIONS') {continue}
    $body = $block.Groups[2].Value
    $pk = [regex]::Match($body,'(\w+) PK').Groups[1].Value
    $foreign = [regex]::Matches($body,'(\w+) FK -> ([A-Z_]+)\.(\w+)( NULL)?')
    $rest = [regex]::Replace($body,'\w+ PK,?','')
    $rest = [regex]::Replace($rest,'\w+ FK -> [A-Z_]+\.\w+( NULL)?,?','')
    $otherLines = @($rest -split '\r?\n' | ForEach-Object {$_.Trim().Trim(',').Trim()} | Where-Object {$_})
    $height = 114 + 40*($foreign.Count+$otherLines.Count)
    $graphics.FillRectangle($fill,[single]$x,[single]$y,1810,58)
    $graphics.DrawRectangle($pen,[single]$x,[single]$y,1810,[single]$height)
    $svg.Add("<rect x='$x' y='$y' width='1810' height='$height' fill='none' stroke='#282828' stroke-width='2.5'/><rect x='$x' y='$y' width='1810' height='58' fill='#ebebeb'/>")
    Label $name ($x+24) ($y+8) 33 $true
    $lineY = $y+70
    Label "$pk  PK" ($x+26) $lineY 28
    $font = [System.Drawing.Font]::new('Arial',28,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
    $pkWidth = $graphics.MeasureString($pk,$font).Width-7
    Line @(@(($x+28),($lineY+32)),@(($x+28+$pkWidth),($lineY+32)))
    $font.Dispose()
    $cards[$name] = @($x,($lineY+17))
    $lineY += 40
    foreach ($fk in $foreign) {
        Label $fk.Value ($x+26) $lineY 28
        $connections += @{Source=@($x,($lineY+17)); Target=$fk.Groups[2].Value}
        $lineY += 40
    }
    foreach ($line in $otherLines) { Label $line ($x+26) $lineY 28; $lineY += 40 }
    $y += $height + 38
}
$colours = @{PLAYER='#245b91'; CLUB='#287044'; LEAGUE='#7950a0'; USER='#925b28'}
$i = 0
foreach ($edge in $connections) {
    $lane = 80 + $i*32
    $start = $edge.Source; $end = $cards[$edge.Target]
    $colour = $colours[$edge.Target]
    $edgePen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($colour),2.8)
    $points = @($start,@($lane,$start[1]),@($lane,$end[1]),$end)
    $drawingPoints = [System.Drawing.PointF[]]@($points | ForEach-Object {[System.Drawing.PointF]::new($_[0],$_[1])})
    $graphics.DrawLines($edgePen,$drawingPoints)
    $coordinates = ($points | ForEach-Object {"$($_[0]),$($_[1])"}) -join ' '
    $svg.Add("<polyline points='$coordinates' fill='none' stroke='$colour' stroke-width='2.8'/>")
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($colour))
    $triangle = @($end,@(($end[0]-18),($end[1]-7)),@(($end[0]-18),($end[1]+7)))
    $graphics.FillPolygon($brush,[System.Drawing.PointF[]]@($triangle | ForEach-Object {[System.Drawing.PointF]::new($_[0],$_[1])}))
    $coords = ($triangle | ForEach-Object {"$($_[0]),$($_[1])"}) -join ' '
    $svg.Add("<polygon points='$coords' fill='$colour'/>")
    $graphics.FillEllipse($brush,[single]($start[0]-4),[single]($start[1]-4),8,8)
    $svg.Add("<circle cx='$($start[0])' cy='$($start[1])' r='4' fill='$colour'/>")
    $edgePen.Dispose(); $brush.Dispose(); $i++
}
Label 'Line crossings are not junctions. Each arrow is a separate foreign-key constraint.' 690 ($y+8) 26
Label 'Source: canonical SQL migrations 001-019. Migration bookkeeping table excluded.' 690 ($y+50) 25
$finalHeight = $y+110
$svg.Add('</svg>')
$svg[0] = $svg[0].Replace('4900',"$finalHeight")
$pngPath = Join-Path $destination 'RELATIONAL_SCHEMA_WITH_ARROWS.png'
$svgPath = Join-Path $destination 'RELATIONAL_SCHEMA_WITH_ARROWS.svg'
$cropped = $bitmap.Clone([System.Drawing.Rectangle]::new(0,0,2600,$finalHeight),$bitmap.PixelFormat)
$cropped.Save($pngPath,[System.Drawing.Imaging.ImageFormat]::Png)
[System.IO.File]::WriteAllLines($svgPath,$svg,[System.Text.UTF8Encoding]::new($false))
$cropped.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $pen.Dispose(); $fill.Dispose()
Write-Output "Saved $pngPath ($i foreign-key arrows)"

