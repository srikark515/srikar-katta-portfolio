# Smooth Scroll Frame Sequence - Native Windows PowerShell Web Server
# Does not require Python or Node.js - works natively on Windows

$port = 3000
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"

try {
    $listener.Prefixes.Add($prefix)
    $listener.Start()
} catch {
    # If port 3000 is busy, try 8080
    $port = 8080
    $prefix = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Smooth Scroll Frame Sequence Server Running!" -ForegroundColor Green
Write-Host "  Localhost link: $prefix" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        $filePath = Join-Path $scriptDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length

            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".jpeg" { "image/jpeg" }
                ".jpg"  { "image/jpeg" }
                ".png"  { "image/png" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $mime

            # Aggressive caching for image frames
            if ($ext -in ".jpeg", ".jpg", ".png", ".js", ".css") {
                $response.AddHeader("Cache-Control", "public, max-age=604800, immutable")
            } else {
                $response.AddHeader("Cache-Control", "no-cache")
            }
            $response.AddHeader("Access-Control-Allow-Origin", "*")

            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}

