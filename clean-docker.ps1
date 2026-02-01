# Script to completely clean Docker (containers, volumes and images)
# Usage: .\clean-docker.ps1

Write-Host "[*] Docker cleanup script for SideBy" -ForegroundColor Cyan
Write-Host ""

# Validate that Docker is available
Write-Host "[+] Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "[OK] Docker available" -ForegroundColor Green
}
catch {
    Write-Host "[-] Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Validate that Docker Compose is available
Write-Host "[+] Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker compose version | Out-Null
    Write-Host "[OK] Docker Compose available" -ForegroundColor Green
}
catch {
    Write-Host "[-] Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# Change to project root folder
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot
Write-Host "[OK] Working directory: $projectRoot" -ForegroundColor Green
Write-Host ""

# Warning
Write-Host "=====================================================================" -ForegroundColor Red
Write-Host "[!] WARNING: This script will remove:" -ForegroundColor Yellow
Write-Host "   1. All project containers (api, client, mongo, mongo-express)" -ForegroundColor Yellow
Write-Host "   2. All volumes (mongo_data, api_node_modules, client_node_modules)" -ForegroundColor Yellow
Write-Host "   3. All built images (sideby-api, sideby-client)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "[!] Operation cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# 1. Stop and remove containers
Write-Host "[*] Step 1/3: Stopping and removing containers..." -ForegroundColor Cyan
docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Containers stopped and removed" -ForegroundColor Green
} else {
    Write-Host "[!] No active containers found or already removed" -ForegroundColor Yellow
}
Write-Host ""

# 2. Remove volumes
Write-Host "[*] Step 2/3: Removing volumes..." -ForegroundColor Cyan
Write-Host "   Looking for SideBy-related volumes..." -ForegroundColor Gray

$volumes = docker volume ls --format "{{.Name}}" | Select-String -Pattern "sideby|mongo_data|api_node_modules|client_node_modules"
if ($volumes) {
    foreach ($volume in $volumes) {
        Write-Host "   Removing volume: $volume" -ForegroundColor Yellow
        docker volume rm $volume 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Volume $volume removed" -ForegroundColor Green
        } else {
            Write-Host "   [!] Could not remove $volume (may be in use)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [!] No SideBy-related volumes found" -ForegroundColor Yellow
}
Write-Host ""

# 3. Remove images
Write-Host "[*] Step 3/3: Removing images..." -ForegroundColor Cyan
Write-Host "   Looking for SideBy-related images..." -ForegroundColor Gray

$images = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "sideby"
if ($images) {
    foreach ($image in $images) {
        Write-Host "   Removing image: $image" -ForegroundColor Yellow
        docker rmi $image -f 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Image $image removed" -ForegroundColor Green
        } else {
            Write-Host "   [!] Could not remove $image" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [!] No SideBy-related images found" -ForegroundColor Yellow
}
Write-Host ""

# Deep cleanup option
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[?] Deep Docker cleanup (optional)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will remove ALL unused images, containers and volumes" -ForegroundColor Yellow
Write-Host "from Docker (not just SideBy)." -ForegroundColor Yellow
Write-Host ""

$deepClean = Read-Host "Do you want to run deep cleanup? (yes/no)"
if ($deepClean -eq "yes") {
    Write-Host ""
    Write-Host "[*] Running deep cleanup..." -ForegroundColor Cyan
    docker system prune -a --volumes -f
    Write-Host "[OK] Deep cleanup completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[OK] Cleanup completed!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application from scratch, run:" -ForegroundColor Cyan
Write-Host "   .\start-app.ps1" -ForegroundColor Green
Write-Host ""
