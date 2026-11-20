Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $root 'docs'
$width = 2400; $height = 2820
$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.TextRenderingHint = 'AntiAliasGridFit'
$pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(40,40,40), 2.5)
$black = [System.Drawing.Brushes]::Black
$fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235,235,235))
$svg = [System.Collections.Generic.List[string]]::new()
$svg.Add('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="2820" viewBox="0 0 2400 2820"><rect width="2400" height="2820" fill="white"/>')
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

Label 'ScoutIQ | RELATIONAL SCHEMA' 100 48 52 $true
Label 'Football scouting and recruitment intelligence' 103 115 30
Label 'Underlined attribute = primary key     Arrow = foreign key to referenced primary key     ... = other attributes' 103 164 26

Section '01   FOOTBALL ENTITIES & PERFORMANCE' 230
$league = Relation 'LEAGUE' 250 365 @('*league_id','...')
$club = Relation 'CLUB' 940 365 @('*club_id','league_id','...')
$player = Relation 'PLAYER' 1840 365 @('*player_id','...')
$membership = Relation 'PLAYER_CLUB' 440 585 @('*player_club_id','player_id','club_id','start_date','...')
$stats = Relation 'PLAYER_STATISTICS' 440 810 @('*stat_id','player_id','club_id','league_id','season','...')
Bus 125 975 $league.league_id 490
Bus 2200 975 $club.club_id 505
Bus 2300 975 $player.player_id 465
Branch $club.league_id 125 535
Branch $membership.player_id 2300 695
Branch $membership.club_id 2200 730
Branch $stats.player_id 2300 925
Branch $stats.club_id 2200 950
Branch $stats.league_id 125 900

Section '02   CONTRACTS, TRANSFERS & PLAYER HISTORY' 1010
$financeClub = Relation 'CLUB' 270 1140 @('*club_id','...')
$financePlayer = Relation 'PLAYER' 1810 1140 @('*player_id','...')
$contract = Relation 'CONTRACT' 460 1330 @('*contract_id','player_id','club_id','start_date','end_date','...')
$transfer = Relation 'TRANSFER' 460 1530 @('*transfer_id','player_id','from_club_id','to_club_id','...')
$injury = Relation 'INJURY' 460 1730 @('*injury_id','player_id','injury_type','status','...')
$valuation = Relation 'MARKET_VALUE_HISTORY' 460 1930 @('*valuation_id','player_id','valuation_date','market_value','...')
Bus 145 2070 $financeClub.club_id 1260
Bus 2260 2070 $financePlayer.player_id 1250
Branch $contract.player_id 2260 1435
Branch $contract.club_id 145 1465
Branch $transfer.player_id 2260 1620
Branch $transfer.from_club_id 145 1640
Branch $transfer.to_club_id 145 1665
Branch $injury.player_id 2260 1835
Branch $valuation.player_id 2260 2035

Section '03   SCOUTING & RECRUITMENT' 2110
$user = Relation 'USER' 270 2240 @('*user_id','...')
$scoutPlayer = Relation 'PLAYER' 1810 2240 @('*player_id','...')
$report = Relation 'SCOUT_REPORT' 460 2415 @('*report_id','scout_user_id','player_id','overall_rating','...')
$shortlist = Relation 'SHORTLIST' 460 2605 @('*shortlist_id','scout_user_id','player_id','priority','status','...')
Bus 145 2740 $user.user_id 2360
Bus 2260 2740 $scoutPlayer.player_id 2340
Branch $report.scout_user_id 145 2515
Branch $report.player_id 2260 2545
Branch $shortlist.scout_user_id 145 2705
Branch $shortlist.player_id 2260 2735
Label '12 application tables | Parent tables repeat across sections for readability. Shared lines reference the same parent key.' 100 2770 24
$svg.Add('</svg>')
$pngPath = Join-Path $destination 'RELATIONAL_SCHEMA_DIAGRAM.png'
$svgPath = Join-Path $destination 'RELATIONAL_SCHEMA_DIAGRAM.svg'
$bitmap.Save($pngPath,[System.Drawing.Imaging.ImageFormat]::Png)
[System.IO.File]::WriteAllLines($svgPath,$svg,[System.Text.UTF8Encoding]::new($false))
$graphics.Dispose(); $bitmap.Dispose(); $pen.Dispose(); $fill.Dispose()
Write-Output $pngPath
Write-Output $svgPath
