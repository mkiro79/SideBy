# Script para arrancar toda la aplicacion
# Uso: .\start-app.ps1

Write-Host "[*] Iniciando SideBy Application..." -ForegroundColor Cyan
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

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Instalando dependencias del workspace root..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[-] Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
}
else {
    Write-Host "[OK] Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""

# Iniciar Docker Compose con todas las aplicaciones
Write-Host "[*] Iniciando servicios con Docker Compose..." -ForegroundColor Yellow
Write-Host "   - MongoDB en puerto 27017" -ForegroundColor Cyan
Write-Host "   - Mongo Express en puerto 8081" -ForegroundColor Cyan
Write-Host "   - API en puerto 3000" -ForegroundColor Cyan
Write-Host "   - Cliente en puerto 5173" -ForegroundColor Cyan
Write-Host "   - Ollama en puerto 11434" -ForegroundColor Cyan
Write-Host ""

docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[-] Error al iniciar Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Servicios iniciados" -ForegroundColor Green
Write-Host ""

# Esperar a que los servicios esten listos
Write-Host "[*] Esperando 15 segundos para que los servicios se inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""

# Verificar/descargar modelo de Ollama para Insights
$insightsModel = if ($env:INSIGHTS_LLM_MODEL) { $env:INSIGHTS_LLM_MODEL } else { "gemma2:9b" }
Write-Host "[*] Verificando modelo Ollama para Insights: $insightsModel" -ForegroundColor Yellow

$ollamaModelList = docker compose exec -T ollama ollama list 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] No se pudo consultar modelos de Ollama. Continuando sin forzar descarga." -ForegroundColor Yellow
}
elseif ($ollamaModelList -match [Regex]::Escape($insightsModel)) {
    Write-Host "[OK] Modelo Ollama disponible: $insightsModel" -ForegroundColor Green
}
else {
    Write-Host "[*] Descargando modelo Ollama: $insightsModel (puede tardar varios minutos)..." -ForegroundColor Yellow
    docker compose exec -T ollama ollama pull $insightsModel

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Modelo Ollama descargado: $insightsModel" -ForegroundColor Green
    }
    else {
        Write-Host "[!] No se pudo descargar el modelo Ollama. El endpoint de insights usara fallback a reglas." -ForegroundColor Yellow
    }
}

Write-Host ""

# Verificar que Docker Compose esta corriendo
Write-Host "[+] Verificando estado de los servicios..." -ForegroundColor Yellow
docker compose ps

Write-Host ""

# Ejecutar seed de la base de datos
Write-Host "[*] Ejecutando seed de la base de datos..." -ForegroundColor Yellow
docker compose exec -T api npm run seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Seed ejecutado correctamente" -ForegroundColor Green
} else {
    Write-Host "[!] Advertencia: El seed fallo o ya existe el usuario admin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[OK] Aplicacion iniciada correctamente!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host "   Cliente:        http://localhost:5173" -ForegroundColor Green
Write-Host "   API:            http://localhost:3000" -ForegroundColor Green
Write-Host "   Mongo Express:  http://localhost:8081" -ForegroundColor Green
Write-Host "   Ollama:         http://localhost:11434" -ForegroundColor Green
Write-Host "     * Credenciales configuradas en .env (ME_BASICAUTH_USERNAME / ME_BASICAUTH_PASSWORD)" -ForegroundColor Gray
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f              (Ver todos los logs)" -ForegroundColor Gray
Write-Host "   docker compose logs -f api          (Ver logs de API)" -ForegroundColor Gray
Write-Host "   docker compose logs -f client       (Ver logs del cliente)" -ForegroundColor Gray
Write-Host "   docker compose ps                   (Ver estado de servicios)" -ForegroundColor Gray
Write-Host "   docker compose down                 (Detener la aplicacion)" -ForegroundColor Gray
Write-Host ""
