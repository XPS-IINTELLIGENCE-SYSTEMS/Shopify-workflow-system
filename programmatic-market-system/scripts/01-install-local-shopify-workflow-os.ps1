# SMA Shopify Workflow OS - Local Installer
# Copy/paste safe. Creates local folders, scraper files, sync scripts, and dashboard scaffold.
# Run:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\01-install-local-shopify-workflow-os.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = 'C:\SMA\SHOPIFY_WORKFLOW_SYSTEM'
$RepoUrl = 'https://github.com/XPS-IINTELLIGENCE-SYSTEMS/Shopify-workflow-system.git'
$DriveRemote = 'gdrive:SHOPIFY WORKFLOW'
$LocalDriveMirror = "$Root\drive_mirror"
$RepoLocal = "$Root\github\Shopify-workflow-system"
$ScraperDir = "$Root\code\scrapers"
$ScriptsDir = "$Root\code\scripts"
$ExportsDir = "$Root\03_MARKET_DISCOVERY\partner_sites\exports"
$DashboardDir = "$Root\dashboard"

function Ensure-Folder { param([string]$Path) if (!(Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null } }
function Write-FileSafe { param([string]$Path,[string]$Content) Ensure-Folder (Split-Path $Path -Parent); Set-Content -Path $Path -Value $Content -Encoding UTF8 }
function Test-Cmd { param([string]$Name) return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }

$Folders = @(
  $Root,
  "$Root\00_ADMIN_COMMAND_CENTER",
  "$Root\01_CLIENT_DISCOVERY",
  "$Root\02_AI_CONSULTANT",
  "$Root\03_MARKET_DISCOVERY\partner_sites\exports",
  "$Root\03_MARKET_DISCOVERY\partner_sites\raw_html",
  "$Root\04_ECONOMICS_AND_SIMULATION",
  "$Root\05_SHOPIFY_BUILD",
  "$Root\06_CONTENT_AND_ADS",
  "$Root\07_COMPLIANCE_AND_CLAIMS",
  "$Root\08_AUTOMATIONS\queue\pending",
  "$Root\08_AUTOMATIONS\queue\applied",
  "$Root\08_AUTOMATIONS\queue\failed",
  "$Root\09_REPORTING",
  "$Root\10_GITHUB_VERCEL_SUPABASE",
  "$Root\11_EXPORTS_AND_HANDOFFS",
  "$Root\code\scrapers",
  "$Root\code\scripts",
  "$Root\github",
  "$Root\dashboard",
  "$Root\drive_mirror",
  "$Root\secrets_DO_NOT_COMMIT",
  "$Root\logs"
)
$Folders | ForEach-Object { Ensure-Folder $_ }

$GitIgnore = @'
.env
.env.local
secrets_DO_NOT_COMMIT/
*.key
*.pem
*.p12
credentials.json
token.json
rclone.conf
.venv/
venv/
__pycache__/
*.pyc
node_modules/
logs/
.DS_Store
Thumbs.db
'@
Write-FileSafe "$Root\.gitignore" $GitIgnore

$EnvTemplate = @'
GROQ_API_KEY=
OPENAI_API_KEY=
SHOPIFY_SHOP_DOMAIN=nourishaccess.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=
GOOGLE_MAPS_API_KEY=
GITHUB_TOKEN=
VERCEL_TOKEN=
RCLONE_REMOTE_NAME=gdrive
ALLOW_PUBLISH=false
ALLOW_AUTO_EMAIL=false
ALLOW_AUTO_SCRAPE=true
ALLOW_GPT_TO_OWN_MATH=false
'@
Write-FileSafe "$Root\secrets_DO_NOT_COMMIT\.env.template" $EnvTemplate

$Requirements = @'
requests
beautifulsoup4
pandas
lxml
openpyxl
python-dotenv
'@
Write-FileSafe "$ScraperDir\requirements.txt" $Requirements

$SeedFile = @'
# Add one partner/model website per line.
# Example:
# https://example.com
'@
Write-FileSafe "$Root\03_MARKET_DISCOVERY\partner_sites\seed_urls.txt" $SeedFile

$Keywords = @'
price
pricing
cost
apply
qualify
book
schedule
buy
order
lead
customer
conversion
offer
guarantee
privacy
consent
terms
'@
Write-FileSafe "$Root\03_MARKET_DISCOVERY\partner_sites\keywords.txt" $Keywords

$RunScraper = @"
Set-StrictMode -Version Latest
`$ErrorActionPreference = 'Stop'
`$Root = '$Root'
`$ScraperDir = '`$Root\code\scrapers'
`$Out = '`$Root\03_MARKET_DISCOVERY\partner_sites\exports'
`$SeedFile = '`$Root\03_MARKET_DISCOVERY\partner_sites\seed_urls.txt'
`$KeywordFile = '`$Root\03_MARKET_DISCOVERY\partner_sites\keywords.txt'
`$VenvPython = '`$ScraperDir\.venv\Scripts\python.exe'
`$ProjectId = Read-Host 'Project ID'
`$Industry = Read-Host 'Industry'
`$DesiredOutcome = Read-Host 'Desired outcome / money goal'
`$TargetAction = Read-Host 'Universal action / conversion'
Set-Location `$ScraperDir
if (!(Test-Path `$VenvPython)) { python -m venv .venv }
& `$VenvPython -m pip install --upgrade pip
& `$VenvPython -m pip install -r requirements.txt
& `$VenvPython universal_partner_scraper.py --out `$Out --seeds-file `$SeedFile --keywords-file `$KeywordFile --project-id `$ProjectId --industry `$Industry --desired-outcome `$DesiredOutcome --target-action `$TargetAction --max-pages 250 --delay 1.2
Write-Host 'Scrape complete.' -ForegroundColor Green
Write-Host `$Out
"@
Write-FileSafe "$ScriptsDir\06-run-universal-partner-scraper.ps1" $RunScraper

$SyncDryRun = @"
Set-StrictMode -Version Latest
`$ErrorActionPreference = 'Stop'
Write-Host 'DRY RUN: Drive sync only. No files changed.' -ForegroundColor Cyan
rclone copy '$Root' '$DriveRemote/LOCAL_MIRROR' --dry-run --exclude 'secrets_DO_NOT_COMMIT/**' --exclude '.git/**' --exclude '.venv/**' --exclude 'node_modules/**' --exclude 'logs/**' --progress
"@
Write-FileSafe "$ScriptsDir\10-drive-sync-dry-run.ps1" $SyncDryRun

$SyncDriveUp = @"
Set-StrictMode -Version Latest
`$ErrorActionPreference = 'Stop'
rclone copy '$Root' '$DriveRemote/LOCAL_MIRROR' --exclude 'secrets_DO_NOT_COMMIT/**' --exclude '.git/**' --exclude '.venv/**' --exclude 'node_modules/**' --exclude 'logs/**' --progress
"@
Write-FileSafe "$ScriptsDir\11-drive-sync-up.ps1" $SyncDriveUp

$SyncDriveDown = @"
Set-StrictMode -Version Latest
`$ErrorActionPreference = 'Stop'
rclone copy '$DriveRemote' '$LocalDriveMirror' --exclude 'secrets_DO_NOT_COMMIT/**' --exclude '.git/**' --exclude '.venv/**' --exclude 'node_modules/**' --exclude 'logs/**' --progress
"@
Write-FileSafe "$ScriptsDir\12-drive-sync-down.ps1" $SyncDriveDown

$GitSync = @"
Set-StrictMode -Version Latest
`$ErrorActionPreference = 'Stop'
if (!(Test-Path '$RepoLocal\.git')) {
  Set-Location '$Root\github'
  git clone '$RepoUrl'
}
Set-Location '$RepoLocal'
git pull
Write-Host 'GitHub repo synced locally.' -ForegroundColor Green
"@
Write-FileSafe "$ScriptsDir\20-github-sync.ps1" $GitSync

$Readme = @"
# Local Shopify Workflow OS

Root: $Root

First safe commands:
1. Configure rclone if needed: rclone config
2. Dry-run Drive sync: powershell -NoProfile -ExecutionPolicy Bypass -File '$ScriptsDir\10-drive-sync-dry-run.ps1'
3. GitHub sync: powershell -NoProfile -ExecutionPolicy Bypass -File '$ScriptsDir\20-github-sync.ps1'
4. Add seed URLs: '$Root\03_MARKET_DISCOVERY\partner_sites\seed_urls.txt'
5. Run scraper: powershell -NoProfile -ExecutionPolicy Bypass -File '$ScriptsDir\06-run-universal-partner-scraper.ps1'

Do not store secrets in GitHub or Drive exports.
"@
Write-FileSafe "$Root\README.md" $Readme

if (Test-Cmd git) { powershell -NoProfile -ExecutionPolicy Bypass -File "$ScriptsDir\20-github-sync.ps1" } else { Write-Host 'Git not found. Install Git first.' -ForegroundColor Yellow }

Write-Host ''
Write-Host 'SMA Shopify Workflow local OS installed:' -ForegroundColor Green
Write-Host $Root
Write-Host ''
Write-Host 'Next: configure rclone if needed: rclone config'
Write-Host 'Then run dry-run sync: powershell -NoProfile -ExecutionPolicy Bypass -File "'$ScriptsDir\10-drive-sync-dry-run.ps1'"'
