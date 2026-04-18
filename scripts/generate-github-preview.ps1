param(
    [string]$OutputPath = "docs/assets/github-social-preview.png"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius
    )

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2

    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

$width = 1280
$height = 640
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.Color]::FromArgb(255, 8, 22, 51),
    [System.Drawing.Color]::FromArgb(255, 16, 123, 210),
    25
)
$graphics.FillRectangle($bgBrush, $backgroundRect)

$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
$graphics.FillEllipse($accentBrush, 760, -80, 420, 420)
$graphics.FillEllipse($accentBrush, 980, 360, 260, 260)
$graphics.FillEllipse($accentBrush, -120, 460, 280, 280)

$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 255, 255, 255))
$panelPath = New-RoundedRectanglePath ([System.Drawing.RectangleF]::new(44, 42, 1192, 556)) 34
$graphics.FillPath($panelBrush, $panelPath)

$whiteBrush = [System.Drawing.Brushes]::White
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 235, 255))
$lightLinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(52, 255, 255, 255), 1.5)
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
$cardBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 18, 36, 72), 1.2)
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 255, 255, 255))
$pillBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 1)
$brandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 40, 136, 255))
$brandBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 190, 170))
$darkTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 33, 63))
$grayTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 90, 104, 132))

$badgeFont = New-Object System.Drawing.Font("Microsoft YaHei", 14, [System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font("Segoe UI", 38, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font("Microsoft YaHei", 18, [System.Drawing.FontStyle]::Regular)
$pillFont = New-Object System.Drawing.Font("Microsoft YaHei", 13, [System.Drawing.FontStyle]::Bold)
$stepNumberFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$stepTitleFont = New-Object System.Drawing.Font("Microsoft YaHei", 16, [System.Drawing.FontStyle]::Bold)
$stepBodyFont = New-Object System.Drawing.Font("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Regular)

$graphics.DrawString("本地文档整理工具", $badgeFont, $mutedBrush, 86, 90)
$graphics.DrawLine($lightLinePen, 86, 124, 224, 124)

$graphics.DrawString("DocuGen", $titleFont, $whiteBrush, 86, 146)
$graphics.DrawString("Markdown DOCX", $titleFont, $whiteBrush, 86, 198)
$graphics.DrawString("PDF 转 Word  |  Markdown 转 DOCX  |  OCR  |  标书整理", $subtitleFont, $mutedBrush, 88, 278)
$graphics.DrawString("接入你自己的 OpenAI-compatible API", $subtitleFont, $mutedBrush, 88, 314)

$pillSpecs = @(
    @{ X = 86;  Y = 394; W = 232; Text = "杂乱文件 -> 规范文档" },
    @{ X = 332; Y = 394; W = 250; Text = "AI 草稿 -> 可交付 DOCX" },
    @{ X = 86;  Y = 446; W = 232; Text = "PDF -> 可编辑 Word" },
    @{ X = 332; Y = 446; W = 250; Text = "标书材料 -> 结构化输出" }
)

foreach ($pill in $pillSpecs) {
    $pillPath = New-RoundedRectanglePath ([System.Drawing.RectangleF]::new($pill.X, $pill.Y, $pill.W, 36)) 18
    $graphics.FillPath($pillBrush, $pillPath)
    $graphics.DrawPath($pillBorderPen, $pillPath)
    $graphics.DrawString($pill.Text, $pillFont, $whiteBrush, $pill.X + 14, $pill.Y + 8)
}

$stepCards = @(
    @{
        X = 760; Y = 104; W = 410; H = 122; Accent = $brandBrush;
        Number = "1"; Title = "导入";
        Body = "PDF、Markdown、DOCX、XLSX、图片"
    },
    @{
        X = 760; Y = 250; W = 410; H = 122; Accent = $brandBrush2;
        Number = "2"; Title = "整理";
        Body = "统一格式并润色 AI 草稿"
    },
    @{
        X = 760; Y = 396; W = 410; H = 122; Accent = $brandBrush;
        Number = "3"; Title = "导出";
        Body = "生成可分享的 DOCX 或 XLSX"
    }
)

foreach ($card in $stepCards) {
    $cardPath = New-RoundedRectanglePath ([System.Drawing.RectangleF]::new($card.X, $card.Y, $card.W, $card.H)) 26
    $graphics.FillPath($cardBrush, $cardPath)
    $graphics.DrawPath($cardBorderPen, $cardPath)

    $graphics.FillEllipse($card.Accent, $card.X + 24, $card.Y + 26, 46, 46)
    $graphics.DrawString($card.Number, $stepNumberFont, $whiteBrush, $card.X + 39, $card.Y + 37)
    $graphics.DrawString($card.Title, $stepTitleFont, $darkTextBrush, $card.X + 92, $card.Y + 28)
    $graphics.DrawString($card.Body, $stepBodyFont, $grayTextBrush, $card.X + 92, $card.Y + 63)
}

$outputFullPath = Join-Path (Get-Location) $OutputPath
$outputDir = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$bitmap.Save($outputFullPath, [System.Drawing.Imaging.ImageFormat]::Png)

$coverPath = Join-Path $outputDir "github-cover.png"
Copy-Item -LiteralPath $outputFullPath -Destination $coverPath -Force

$graphics.Dispose()
$bitmap.Dispose()
$bgBrush.Dispose()
$accentBrush.Dispose()
$panelBrush.Dispose()
$lightLinePen.Dispose()
$cardBrush.Dispose()
$cardBorderPen.Dispose()
$pillBrush.Dispose()
$pillBorderPen.Dispose()
$brandBrush.Dispose()
$brandBrush2.Dispose()
$mutedBrush.Dispose()
$darkTextBrush.Dispose()
$grayTextBrush.Dispose()
$badgeFont.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$pillFont.Dispose()
$stepNumberFont.Dispose()
$stepTitleFont.Dispose()
$stepBodyFont.Dispose()

Write-Output $outputFullPath

