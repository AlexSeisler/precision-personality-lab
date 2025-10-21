# Precision Personality Lab - Simple Health Check

$apiRoot = "http://localhost:3000/api"

Write-Host "`n🔹 Testing Health Check ..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$apiRoot/health" -Method GET
    Write-Host "✅ Health Check OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "❌ Health Check FAILED:`n$($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDone.`n" -ForegroundColor Cyan
