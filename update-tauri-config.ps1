# Update Tauri Configuration
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Updating Tauri Configuration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$configPath = "src-tauri\tauri.conf.json"

if (Test-Path $configPath) {
    Write-Host "Reading config file..." -ForegroundColor Yellow
    
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    
    # Update basic info
    $config.productName = "rose.dev AI IDE"
    $config.version = "2.0.21"
    $config.identifier = "com.prosinres.rosedev.ide"
    
    # Update build config
    $config.build.frontendDist = "../.next"
    
    # Update window config
    $config.app.windows[0].title = "rose.dev AI IDE"
    $config.app.windows[0].width = 1400
    $config.app.windows[0].height = 900
    $config.app.windows[0] | Add-Member -NotePropertyName "center" -NotePropertyValue $true -Force
    
    # Save updated config
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    
    Write-Host "Configuration updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Updated values:" -ForegroundColor Cyan
    Write-Host "  - Product Name: rose.dev AI IDE" -ForegroundColor White
    Write-Host "  - Version: 2.0.21" -ForegroundColor White
    Write-Host "  - Identifier: com.prosinres.rosedev.ide" -ForegroundColor White
    Write-Host "  - Frontend Dist: ../.next" -ForegroundColor White
    Write-Host "  - Window Size: 1400x900" -ForegroundColor White
} else {
    Write-Host "Config file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Test development mode:" -ForegroundColor Yellow
Write-Host "   npm run tauri:dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Build for production:" -ForegroundColor Yellow
Write-Host "   npm run tauri:build" -ForegroundColor White
Write-Host ""
