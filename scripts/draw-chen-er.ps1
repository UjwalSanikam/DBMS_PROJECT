Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$destination = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs'
$width = 2900; $height = 4520
$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.Clear([System.Drawing.Color]::White)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#172b3a'))
$pen = [System.Drawing.Pen]::new($ink.Color, 2.3)
$svg = [System.Collections.Generic.List[string]]::new()
$svg.Add("<svg xmlns='http://www.w3.org/2000/svg' width='$width' height='$height' viewBox='0 0 $width $height'><rect width='100%' height='100%' fill='white'/>")
function Text($s, $x, $y, $size=24, $bold=$false, $underline=$false) {
    $style = if ($bold) {[System.Drawing.FontStyle]::Bold} else {[System.Drawing.FontStyle]::Regular}
    if ($underline) {$style = $style -bor [System.Drawing.FontStyle]::Underline}
    $font = [System.Drawing.Font]::new('Arial', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = 'Center'; $format.LineAlignment = 'Center'
    $g.DrawString($s, $font, $ink, [single]$x, [single]$y, $format)
    $weight = if ($bold) {'bold'} else {'normal'}
    $decoration = if ($underline) {'underline'} else {'none'}
    $safe = [System.Security.SecurityElement]::Escape($s)
    $svg.Add("<text x='$x' y='$y' text-anchor='middle' dominant-baseline='central' font-family='Arial,sans-serif' font-size='$size' font-weight='$weight' text-decoration='$decoration' fill='#172b3a'>$safe</text>")
    $font.Dispose(); $format.Dispose()
}
function Line($x1,$y1,$x2,$y2) {
    $g.DrawLine($pen,[single]$x1,[single]$y1,[single]$x2,[single]$y2)
    $svg.Add("<line x1='$x1' y1='$y1' x2='$x2' y2='$y2' stroke='#172b3a' stroke-width='2.3'/>")
}
function Shape($kind,$x,$y,$w,$h,$fill) {
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($fill))
    if ($kind -eq 'oval') {
        $g.FillEllipse($brush,[single]($x-$w/2),[single]($y-$h/2),[single]$w,[single]$h)
        $g.DrawEllipse($pen,[single]($x-$w/2),[single]($y-$h/2),[single]$w,[single]$h)
        $svg.Add("<ellipse cx='$x' cy='$y' rx='$($w/2)' ry='$($h/2)' fill='$fill' stroke='#172b3a' stroke-width='2.3'/>")
    } elseif ($kind -eq 'diamond') {
        $points = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new($x,$y-$h/2),[System.Drawing.PointF]::new($x+$w/2,$y),[System.Drawing.PointF]::new($x,$y+$h/2),[System.Drawing.PointF]::new($x-$w/2,$y))
        $g.FillPolygon($brush,$points); $g.DrawPolygon($pen,$points)
        $svg.Add("<polygon points='$x,$($y-$h/2) $($x+$w/2),$y $x,$($y+$h/2) $($x-$w/2),$y' fill='$fill' stroke='#172b3a' stroke-width='2.3'/>")
    } else {
        $g.FillRectangle($brush,[single]($x-$w/2),[single]($y-$h/2),[single]$w,[single]$h)
        $g.DrawRectangle($pen,[single]($x-$w/2),[single]($y-$h/2),[single]$w,[single]$h)
        $svg.Add("<rect x='$($x-$w/2)' y='$($y-$h/2)' width='$w' height='$h' fill='$fill' stroke='#172b3a' stroke-width='2.3'/>")
    }
    $brush.Dispose()
}
$attributes = @{
    LEAGUE = @('*league_id','league_name','country','tier')
    CLUB = @('*club_id','club_name','country','city','founded_year')
    PLAYER = @('*player_id','first_name','last_name','date_of_birth','nationality','primary_position')
    USER = @('*user_id','full_name','email','role')
    PLAYER_CLUB = @('*player_club_id','start_date','end_date','shirt_number','is_current')
    PLAYER_STATISTICS = @('*stat_id','season','appearances','minutes_played','goals','assists')
    CONTRACT = @('*contract_id','start_date','end_date','weekly_salary','release_clause','contract_status')
    TRANSFER = @('*transfer_id','transfer_date','transfer_type','transfer_fee','currency')
    INJURY = @('*injury_id','injury_type','injury_date','expected_return_date','severity','status')
    MARKET_VALUE_HISTORY = @('*valuation_id','valuation_date','market_value','currency','source_label')
    SCOUT_REPORT = @('*report_id','overall_rating','recommendation','strengths','weaknesses','tactical_fit')
    SHORTLIST = @('*shortlist_id','priority','status','reason')
}
function Entity($name,$x,$y) {
    $attrs = $attributes[$name]
    for ($i=0; $i -lt $attrs.Count; $i++) {
        $top = $i -lt 3
        $count = if ($top) {[Math]::Min(3,$attrs.Count)} else {$attrs.Count-3}
        $index = if ($top) {$i} else {$i-3}
        $ax = $x + ($index-($count-1)/2)*280
        $ay = $y + $(if ($top) {-122} else {122})
        Line $x $y $ax $ay
        Shape 'oval' $ax $ay 260 56 '#ffffff'
        Text $attrs[$i].TrimStart('*') $ax $ay 21 $false $attrs[$i].StartsWith('*')
    }
    Shape 'rect' $x $y 410 76 '#e8f1f7'
    Text $name $x $y 27 $true
}
function Link($left,$right,$y,$name,$lmin,$rmin) {
    $middle = ($left+$right)/2
    $a = $left+205; $b = $middle-110; $c = $middle+110; $d = $right-205
    Line $a $y $b $y; Line $c $y $d $y
    if ($lmin -eq '(1,1)') {Line $a ($y+7) $b ($y+7)}
    if ($rmin -eq '(1,1)') {Line $c ($y+7) $d ($y+7)}
    Shape 'diamond' $middle $y 220 110 '#fff3d8'
    Text $name $middle $y 22 $true
    Text $lmin (($a+$b)/2) ($y-24) 23
    Text $rmin (($c+$d)/2) ($y-24) 23
}
function Row($index,$title) {
    $y = 490 + $index*440
    Text $title 1450 ($y-193) 26 $true
    Line 70 ($y+204) 2830 ($y+204)
    return $y
}
Text 'ScoutIQ | Chen ER Diagram' 1450 70 49 $true
Text '12 entities / 17 relationships / based on src/db/migrations' 1450 132 27
Text 'Rectangle = entity     Diamond = relationship     Oval = attribute     Underline = primary key' 1450 188 25
Text '(min,max) beside an entity = its participation; N = many. Double line = mandatory participation.' 1450 232 25
Text 'Repeated named rectangles are the same entity. Selected attributes shown; foreign keys are represented by relationships.' 1450 272 23
$y = Row 0 '01 / League membership'
Entity 'LEAGUE' 450 $y; Entity 'CLUB' 1450 $y
Link 450 1450 $y 'CONTAINS' '(0,N)' '(1,1)'
Text 'Every club belongs to exactly one league.' 2440 $y 25
$y = Row 1 '02 / Player club history'
Entity 'PLAYER' 450 $y; Entity 'PLAYER_CLUB' 1450 $y; Entity 'CLUB' 2450 $y
Link 450 1450 $y 'HAS TENURE' '(0,N)' '(1,1)'
Link 1450 2450 $y 'AT CLUB' '(1,1)' '(0,N)'
$y = Row 2 '03 / Performance by player and club'
Entity 'PLAYER' 450 $y; Entity 'PLAYER_STATISTICS' 1450 $y; Entity 'CLUB' 2450 $y
Link 450 1450 $y 'HAS STATS' '(0,N)' '(1,1)'
Link 1450 2450 $y 'FOR CLUB' '(1,1)' '(0,N)'
$y = Row 3 '04 / Performance by league'
Entity 'LEAGUE' 450 $y; Entity 'PLAYER_STATISTICS' 1450 $y
Link 450 1450 $y 'IN LEAGUE' '(0,N)' '(1,1)'
Text 'One record per player, club, league and season.' 2440 $y 25
$y = Row 4 '05 / Player contracts'
Entity 'PLAYER' 450 $y; Entity 'CONTRACT' 1450 $y; Entity 'CLUB' 2450 $y
Link 450 1450 $y 'SIGNS' '(0,N)' '(1,1)'
Link 1450 2450 $y 'ISSUED BY' '(1,1)' '(0,N)'
$y = Row 5 '06 / Transfers (source and destination are separate club roles)'
Entity 'PLAYER' 450 $y; Entity 'TRANSFER' 1450 $y; Entity 'CLUB' 2450 $y
Link 450 1450 $y 'UNDERGOES' '(0,N)' '(1,1)'
# Two independent optional club relationships, routed above and below the entity center.
foreach ($offset in @(-55,55)) {
    $dy = $y+$offset; $cx = 1950
    Line 1655 $y 1710 $dy; Line 1710 $dy 1840 $dy
    Line 2060 $dy 2190 $dy; Line 2190 $dy 2245 $y
    Shape 'diamond' $cx $dy 220 86 '#fff3d8'
    $role = if ($offset -lt 0) {'FROM CLUB'} else {'TO CLUB'}
    Text $role $cx $dy 21 $true
    Text '(0,1)' 1760 ($dy-22) 22
    Text '(0,N)' 2140 ($dy-22) 22
}
$y = Row 6 '07 / Injury and market value history'
Entity 'INJURY' 450 $y; Entity 'PLAYER' 1450 $y; Entity 'MARKET_VALUE_HISTORY' 2450 $y
Link 450 1450 $y 'SUFFERS' '(1,1)' '(0,N)'
Link 1450 2450 $y 'VALUED AT' '(0,N)' '(1,1)'
$y = Row 7 '08 / Scouting reports'
Entity 'USER' 450 $y; Entity 'SCOUT_REPORT' 1450 $y; Entity 'PLAYER' 2450 $y
Link 450 1450 $y 'WRITES' '(0,N)' '(1,1)'
Link 1450 2450 $y 'EVALUATES' '(1,1)' '(0,N)'
$y = Row 8 '09 / Recruitment shortlist entries'
Entity 'USER' 450 $y; Entity 'SHORTLIST' 1450 $y; Entity 'PLAYER' 2450 $y
Link 450 1450 $y 'MAINTAINS' '(0,N)' '(1,1)'
Link 1450 2450 $y 'TARGETS' '(1,1)' '(0,N)'
Text 'USER includes ADMIN and SCOUT accounts. Shortlist entries are unique per user and player.' 1450 4458 24
$svg.Add('</svg>')
[System.IO.File]::WriteAllLines((Join-Path $destination 'ER_DIAGRAM_CHEN.svg'), $svg)
$bitmap.Save((Join-Path $destination 'ER_DIAGRAM_CHEN.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bitmap.Dispose(); $pen.Dispose(); $ink.Dispose()
Write-Output 'Created docs/ER_DIAGRAM_CHEN.svg and docs/ER_DIAGRAM_CHEN.png'
