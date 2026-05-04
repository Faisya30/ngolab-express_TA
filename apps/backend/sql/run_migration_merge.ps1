<#
Run migration merge script (Windows PowerShell)

Usage:
  Open PowerShell as user with mysql client installed and in PATH.
  cd C:\payiyi\ngolab-express_TA
  .\apps\backend\sql\run_migration_merge.ps1

This script will:
  - load DB config from apps/backend/.env if present
  - ask for DB password if not provided in .env
  - create a mysqldump backup file `db_backup_before_merge.sql`
  - run `migration_merge_transactions.sql`
  - print simple verification counts

NOTE: Review and test on staging first. This script runs commands that modify the DB.
#>

function Read-EnvFile($path) {
    $result = @{}
    if (Test-Path $path) {
        Get-Content $path | ForEach-Object {
            if ($_ -match "^\s*#") { return }
            if ($_ -match "^\s*$") { return }
            $pair = $_ -split "=",2
            if ($pair.Length -eq 2) { $key = $pair[0].Trim(); $val = $pair[1].Trim(); $result[$key] = $val }
        }
    }
    return $result
}

$envPath = Join-Path $PSScriptRoot "..\..\apps\backend\.env"  # relative path from script
if (-not (Test-Path $envPath)) { $envPath = Join-Path $PSScriptRoot "..\apps\backend\.env" }
if (-not (Test-Path $envPath)) { $envPath = Join-Path $PSScriptRoot "apps\backend\.env" }

$cfg = Read-EnvFile $envPath

$DB_HOST = $cfg['DB_HOST']  -or '127.0.0.1'
$DB_PORT = $cfg['DB_PORT']  -or '3306'
$DB_USER = $cfg['DB_USER']  -or 'root'
$DB_NAME = $cfg['DB_NAME']  -or (Read-Host 'DB_NAME (enter database name)')

if ($cfg['DB_PASSWORD']) {
    $DB_PASSWORD = $cfg['DB_PASSWORD']
} else {
    $secure = Read-Host -Prompt 'DB password (input hidden)' -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host "Using DB: $DB_USER@$DB_HOST:$DB_PORT -> $DB_NAME"
if ((Read-Host 'Proceed to create backup and run migration? (y/N)') -ne 'y') { Write-Host 'Aborted by user.'; exit 1 }

$sqlFile = Join-Path $PSScriptRoot "migration_merge_transactions.sql"
if (-not (Test-Path $sqlFile)) { Write-Host "Migration SQL not found: $sqlFile"; exit 1 }

function Check-Command($name) {
    try { Get-Command $name -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

if (-not (Check-Command 'mysqldump')) { Write-Host 'mysqldump not found in PATH. Install MySQL client or add to PATH.'; exit 1 }
if (-not (Check-Command 'mysql')) { Write-Host 'mysql client not found in PATH. Install MySQL client or add to PATH.'; exit 1 }

$backupFile = Join-Path $PSScriptRoot "..\..\db_backup_before_merge.sql"
Write-Host "Creating backup to $backupFile ..."
$dumpCmd = "mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p`"$DB_PASSWORD`" $DB_NAME > `"$backupFile`""
Write-Host $dumpCmd
cmd /c $dumpCmd
if ($LASTEXITCODE -ne 0) { Write-Host 'mysqldump failed. Aborting.'; exit 1 }

Write-Host 'Backup created. Running migration SQL...'
$applyCmd = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p`"$DB_PASSWORD`" $DB_NAME < `"$sqlFile`""
Write-Host $applyCmd
cmd /c $applyCmd
if ($LASTEXITCODE -ne 0) { Write-Host 'Migration script failed. Check output and consider restoring from backup.'; exit 1 }

Write-Host 'Migration applied. Running verification queries...'
$verifyQueries = @(
    "SELECT 'menu_items_total' as what, COUNT(*) AS cnt FROM menu_items;",
    "SELECT 'menu_items_backed' as what, COUNT(*) AS cnt FROM menu_items_backup;",
    "SELECT 'new_products_total' as what, COUNT(*) AS cnt FROM products;",
    "SELECT 'transactions_total' as what, COUNT(*) AS cnt FROM transactions;",
    "SELECT 'transactions_backed' as what, COUNT(*) AS cnt FROM transactions_backup;",
    "SELECT 'orders_total' as what, COUNT(*) AS cnt FROM orders;",
    "SELECT 'transaction_items_total' as what, COUNT(*) AS cnt FROM transaction_items;",
    "SELECT 'transaction_items_backed' as what, COUNT(*) AS cnt FROM transaction_items_backup;",
    "SELECT 'order_items_total' as what, COUNT(*) AS cnt FROM order_items;"
)

foreach ($q in $verifyQueries) {
    Write-Host "---- $q"
    $cmd = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p`"$DB_PASSWORD`" -D $DB_NAME -e `"$q`""
    cmd /c $cmd
}

Write-Host 'Done. If verification looks good, manually drop duplicate tables as commented in the migration SQL.'
