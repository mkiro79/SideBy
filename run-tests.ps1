# Script para ejecutar los tests de la aplicacion completa
# Uso: .\run-tests.ps1

Write-Host "[*] Ejecutando tests de SideBy..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Colores para los resultados
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Yellow"

# Contadores
$totalTests = 0
$failedTests = 0

# Funcion para ejecutar tests en una app
function Run-AppTests {
    param(
        [string]$appName,
        [string]$appPath
    )
    
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "[*] Ejecutando tests de $appName" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Cambiar a la carpeta de la app
    Push-Location $appPath
    
    # Ejecutar tests
    Write-Host "Ejecutando: npm run test:run" -ForegroundColor Gray
    Write-Host ""
    
    npm run test:run
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Tests de ${appName} - PASARON" -ForegroundColor $successColor
    }
    else {
        Write-Host ""
        Write-Host "[-] Tests de ${appName} - FALLARON" -ForegroundColor $errorColor
        $global:failedTests++
    }
    
    $global:totalTests++
    Pop-Location
    Write-Host ""
}

# Validar que npm esta disponible
Write-Host "[+] Verificando npm..." -ForegroundColor Yellow
try {
    npm --version | Out-Null
}
catch {
    Write-Host "[-] npm no esta instalado o no esta en PATH" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] npm version: $(npm --version)" -ForegroundColor Green
Write-Host ""

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Instalando dependencias del workspace..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[-] Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Ejecutar tests de API
Run-AppTests -appName "API" -appPath "solution-sideby/apps/api"

# Ejecutar tests de Cliente
Run-AppTests -appName "Cliente (React)" -appPath "solution-sideby/apps/client"

# Resumen final
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[*] RESUMEN DE TESTS" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "[OK] Todos los tests pasaron correctamente!" -ForegroundColor $successColor
    Write-Host ""
    exit 0
}
else {
    Write-Host "[-] $failedTests de $totalTests suites tuvieron fallos" -ForegroundColor $errorColor
    Write-Host ""
    exit 1
}
