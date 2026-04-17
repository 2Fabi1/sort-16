$ErrorActionPreference = "Stop"

Write-Host "`n=== Sort-16 D1 Setup ===`n" -ForegroundColor Cyan

# 1. Create D1 database
Write-Host "Creating D1 database..." -ForegroundColor Yellow
$output = npx wrangler d1 create sort-16-db 2>&1 | Out-String
Write-Host $output

$match = [regex]::Match($output, 'database_id\s*=\s*"([^"]+)"')
if (-not $match.Success) {
    Write-Host "Could not parse database_id from wrangler output. Check above for errors." -ForegroundColor Red
    exit 1
}
$dbId = $match.Groups[1].Value
Write-Host "Got database_id: $dbId`n" -ForegroundColor Green

# 2. Patch wrangler.jsonc with the real ID
Write-Host "Updating wrangler.jsonc..." -ForegroundColor Yellow
$wrangler = Get-Content -Path "wrangler.jsonc" -Raw
$wrangler = $wrangler -replace "REPLACE_WITH_ACTUAL_D1_DATABASE_ID", $dbId
Set-Content -Path "wrangler.jsonc" -Value $wrangler
Write-Host "Done.`n" -ForegroundColor Green

# 3. Set JWT secret
Write-Host "Set your JWT_SECRET (any long random string):" -ForegroundColor Yellow
$secret = Read-Host -Prompt "JWT_SECRET"
$secret | npx wrangler secret put JWT_SECRET
Write-Host ""

# 4. Run migration
Write-Host "Running D1 migration (remote)..." -ForegroundColor Yellow
npm run db:migrate:remote
Write-Host ""

# 5. Deploy
Write-Host "Deploying to Cloudflare Workers..." -ForegroundColor Yellow
npm run deploy
Write-Host ""

Write-Host "All done! Your app is live." -ForegroundColor Green
