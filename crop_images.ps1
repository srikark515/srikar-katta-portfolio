Add-Type -AssemblyName System.Drawing

function Make-Square-Crop {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$cropY = 0,
        [int]$targetSize = 640
    )
    $src = [System.Drawing.Image]::FromFile($sourcePath)
    $w = $src.Width
    $h = $src.Height
    
    $sqSize = [Math]::Min($w, $h)
    $srcX = [int](($w - $sqSize) / 2)
    $srcY = $cropY
    if ($srcY + $sqSize -gt $h) { $srcY = $h - $sqSize }
    if ($srcY -lt 0) { $srcY = 0 }
    
    $dest = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $srcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $sqSize, $sqSize)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetSize, $targetSize)
    
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]96)
    
    $dest.Save($destPath, $encoder, $encoderParams)
    
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Created: $destPath ($targetSize x $targetSize)"
}

$baseDir = "e:\srikar\portfolio\animated footage\frames_02\assets\films"
$uploaded = "C:\Users\ADMIN\.gemini\antigravity\brain\2d414c83-1065-46d8-88fa-eca43a47da71\.user_uploaded"

# 1. Avengers: Endgame (media_1793860593540_f502923c.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793860593540_f502923c.jpg" -destPath "$baseDir\film_avengers.jpg" -cropY 0 -targetSize 640

# 2. Thunderbolts* (media_1793860593528_e5014945.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793860593528_e5014945.jpg" -destPath "$baseDir\film_thunderbolts.jpg" -cropY 0 -targetSize 640

# 3. The Fantastic 4: First Steps (media_1793860593517_b9357363.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793860593517_b9357363.jpg" -destPath "$baseDir\film_fantastic4.jpg" -cropY 0 -targetSize 640

# 4. The Electric State (media_1793860593529_3a238838.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793860593529_3a238838.jpg" -destPath "$baseDir\film_electricstate.jpg" -cropY 0 -targetSize 640

# 5. Madame Web (media_1793860593540_b1bcbcf9.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793860593540_b1bcbcf9.jpg" -destPath "$baseDir\film_madameweb.jpg" -cropY 100 -targetSize 640

# 6. Kalki 2898 AD (media_1793861469626_d12dba3c.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793861469626_d12dba3c.jpg" -destPath "$baseDir\film_kalki.jpg" -cropY 35 -targetSize 640

# 7. A Minecraft Movie (media_1793861469628_326e9b93.jpg)
Make-Square-Crop -sourcePath "$uploaded\media_1793861469628_326e9b93.jpg" -destPath "$baseDir\film_minecraft.jpg" -cropY 0 -targetSize 640
