# Script para limpiar completamente Docker (contenedores, volumenes e imagenes)
# Uso: .\clean-docker.ps1

Write-Host "[*] Script de limpieza de Docker para SideBy" -ForegroundColor Cyan
Write-Host ""

# Validar que Docker esta disponible
Write-Host "[+] Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "[OK] Docker disponible" -ForegroundColor Green
}
catch {
    Write-Host "[-] Docker no esta instalado o no esta en PATH" -ForegroundColor Red
    exit 1
}

# Validar que Docker Compose esta disponible
Write-Host "[+] Verificando Docker Compose..." -ForegroundColor Yellow
try {
    docker compose version | Out-Null
    Write-Host "[OK] Docker Compose disponible" -ForegroundColor Green
}
catch {
    Write-Host "[-] Docker Compose no esta instalado" -ForegroundColor Red
    exit 1
}

# Cambiar a la carpeta raiz del proyecto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot
Write-Host "[OK] Working directory: $projectRoot" -ForegroundColor Green
Write-Host ""

# Advertencia
Write-Host "=====================================================================" -ForegroundColor Red
Write-Host "[!] ADVERTENCIA: Este script eliminara:" -ForegroundColor Yellow
Write-Host "   1. Todos los contenedores del proyecto (api, client, mongo, mongo-express)" -ForegroundColor Yellow
Write-Host "   2. Todos los volumenes (mongo_data, api_node_modules, client_node_modules)" -ForegroundColor Yellow
Write-Host "   3. Todas las imagenes construidas (sideby-api, sideby-client)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Estas seguro de que deseas continuar? (si/no)"
if ($confirmation -ne "si") {
    Write-Host "[!] Operacion cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# 1. Detener y eliminar contenedores
Write-Host "[*] Paso 1/3: Deteniendo y eliminando contenedores..." -ForegroundColor Cyan
docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Contenedores detenidos y eliminados" -ForegroundColor Green
} else {
    Write-Host "[!] No se encontraron contenedores activos o ya fueron eliminados" -ForegroundColor Yellow
}
Write-Host ""

# 2. Eliminar volumenes
Write-Host "[*] Paso 2/3: Eliminando volumenes..." -ForegroundColor Cyan
Write-Host "   Buscando volumenes relacionados con SideBy..." -ForegroundColor Gray

$volumes = docker volume ls --format "{{.Name}}" | Select-String -Pattern "sideby|mongo_data|api_node_modules|client_node_modules"
if ($volumes) {
    foreach ($volume in $volumes) {
        Write-Host "   Eliminando volumen: $volume" -ForegroundColor Yellow
        docker volume rm $volume 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Volumen $volume eliminado" -ForegroundColor Green
        } else {
            Write-Host "   [!] No se pudo eliminar $volume (puede estar en uso)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [!] No se encontraron volumenes relacionados con SideBy" -ForegroundColor Yellow
}
Write-Host ""

# 3. Eliminar imagenes
Write-Host "[*] Paso 3/3: Eliminando imagenes..." -ForegroundColor Cyan
Write-Host "   Buscando imagenes relacionadas con SideBy..." -ForegroundColor Gray

$images = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "sideby"
if ($images) {
    foreach ($image in $images) {
        Write-Host "   Eliminando imagen: $image" -ForegroundColor Yellow
        docker rmi $image -f 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Imagen $image eliminada" -ForegroundColor Green
        } else {
            Write-Host "   [!] No se pudo eliminar $image" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [!] No se encontraron imagenes relacionadas con SideBy" -ForegroundColor Yellow
}
Write-Host ""

# Opcion de limpieza profunda
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[?] Limpieza profunda de Docker (opcional)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esto eliminara TODAS las imagenes, contenedores y volumenes no utilizados" -ForegroundColor Yellow
Write-Host "de Docker (no solo los de SideBy)." -ForegroundColor Yellow
Write-Host ""

$deepClean = Read-Host "Deseas ejecutar limpieza profunda? (si/no)"
if ($deepClean -eq "si") {
    Write-Host ""
    Write-Host "[*] Ejecutando limpieza profunda..." -ForegroundColor Cyan
    docker system prune -a --volumes -f
    Write-Host "[OK] Limpieza profunda completada" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[OK] Limpieza completada!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para volver a iniciar la aplicacion desde cero, ejecuta:" -ForegroundColor Cyan
Write-Host "   .\start-app.ps1" -ForegroundColor Green
Write-Host ""
