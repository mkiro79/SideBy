# 🧪 Script de Validación de Fases - React Query + RFC-004
# Uso: .\validate-phase.ps1 -Phase 1

param(
    [Parameter(Mandatory=$true)]
    [ValidateRange(1,8)]
    [int]$Phase
)

$ErrorActionPreference = "Continue"
$ClientPath = "solution-sideby\apps\client"

# Colores para output
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "⚠️  $args" -ForegroundColor Yellow }

# Header
Write-Host "`n🔍 Validando PHASE-$Phase`n" -ForegroundColor Magenta

# Navegar a directorio del cliente
Set-Location $ClientPath

# Variables de validación
$AllChecksPassed = $true

# ============================================================================
# PHASE 1: QueryClient Setup
# ============================================================================
if ($Phase -eq 1) {
    Write-Info "Validando PHASE-1: QueryClient Setup..."
    
    # 1. Verificar archivos creados
    Write-Host "`n📁 Archivos Esperados:" -ForegroundColor Yellow
    
    $files = @(
        "src\lib\queryClient.ts",
        "src\test\utils\react-query.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 2. Verificar que App.tsx tiene QueryClientProvider
    Write-Host "`n🔍 Verificando App.tsx..." -ForegroundColor Yellow
    
    if (Test-Path "src\App.tsx") {
        $appContent = Get-Content "src\App.tsx" -Raw
        if ($appContent -match "QueryClientProvider") {
            Write-Success "App.tsx tiene QueryClientProvider"
        } else {
            Write-Error-Custom "App.tsx NO tiene QueryClientProvider"
            $AllChecksPassed = $false
        }
        
        if ($appContent -match "ReactQueryDevtools") {
            Write-Success "App.tsx tiene ReactQueryDevtools"
        } else {
            Write-Warning-Custom "ReactQueryDevtools no encontrado (opcional en dev)"
        }
    }
    
    # 3. Ejecutar tests
    Write-Host "`n🧪 Ejecutando Tests..." -ForegroundColor Yellow
    
    npm test -- queryClient 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de queryClient pasando"
    } else {
        Write-Error-Custom "Tests de queryClient FALLANDO"
        $AllChecksPassed = $false
    }
    
    # 4. Verificar package.json tiene las dependencias
    Write-Host "`n📦 Verificando Dependencias..." -ForegroundColor Yellow
    
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.dependencies.'@tanstack/react-query') {
        Write-Success "@tanstack/react-query instalado"
    } else {
        Write-Error-Custom "@tanstack/react-query NO instalado"
        $AllChecksPassed = $false
    }
    
    if ($packageJson.devDependencies.'@tanstack/react-query-devtools') {
        Write-Success "@tanstack/react-query-devtools instalado"
    } else {
        Write-Warning-Custom "@tanstack/react-query-devtools NO instalado (opcional)"
    }
}

# ============================================================================
# PHASE 2: Migrate Queries
# ============================================================================
elseif ($Phase -eq 2) {
    Write-Info "Validando PHASE-2: Migrate Queries..."
    
    # 1. Verificar archivos creados
    Write-Host "`n📁 Archivos Esperados:" -ForegroundColor Yellow
    
    $files = @(
        "src\features\dataset\services\datasets.api.ts",
        "src\features\dataset\hooks\useDatasets.ts",
        "src\features\dataset\hooks\useDataset.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 2. Verificar que hooks usan useQuery
    Write-Host "`n🔍 Verificando Hooks..." -ForegroundColor Yellow
    
    if (Test-Path "src\features\dataset\hooks\useDatasets.ts") {
        $content = Get-Content "src\features\dataset\hooks\useDatasets.ts" -Raw
        if ($content -match "useQuery") {
            Write-Success "useDatasets usa useQuery"
        } else {
            Write-Error-Custom "useDatasets NO usa useQuery"
            $AllChecksPassed = $false
        }
    }
    
    # 3. Ejecutar tests de hooks
    Write-Host "`n🧪 Ejecutando Tests de Hooks..." -ForegroundColor Yellow
    
    npm test -- useDatasets 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de useDatasets pasando"
    } else {
        Write-Error-Custom "Tests de useDatasets FALLANDO"
        $AllChecksPassed = $false
    }
    
    npm test -- useDataset 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de useDataset pasando"
    } else {
        Write-Error-Custom "Tests de useDataset FALLANDO"
        $AllChecksPassed = $false
    }
}

# ============================================================================
# PHASE 3: Migrate Mutations
# ============================================================================
elseif ($Phase -eq 3) {
    Write-Info "Validando PHASE-3: Migrate Mutations..."
    
    # 1. Verificar archivos creados
    Write-Host "`n📁 Archivos Esperados:" -ForegroundColor Yellow
    
    $files = @(
        "src\features\dataset\hooks\useUpdateDataset.ts",
        "src\features\dataset\hooks\useDeleteDataset.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 2. Verificar que mutations tienen optimistic updates
    Write-Host "`n🔍 Verificando Optimistic Updates..." -ForegroundColor Yellow
    
    if (Test-Path "src\features\dataset\hooks\useDeleteDataset.ts") {
        $content = Get-Content "src\features\dataset\hooks\useDeleteDataset.ts" -Raw
        if ($content -match "onMutate") {
            Write-Success "useDeleteDataset tiene onMutate (optimistic update)"
        } else {
            Write-Warning-Custom "useDeleteDataset no tiene optimistic update"
        }
    }
    
    # 3. Ejecutar tests de mutations
    Write-Host "`n🧪 Ejecutando Tests de Mutations..." -ForegroundColor Yellow
    
    npm test -- useUpdateDataset 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de useUpdateDataset pasando"
    } else {
        Write-Error-Custom "Tests de useUpdateDataset FALLANDO"
        $AllChecksPassed = $false
    }
    
    npm test -- useDeleteDataset 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de useDeleteDataset pasando"
    } else {
        Write-Error-Custom "Tests de useDeleteDataset FALLANDO"
        $AllChecksPassed = $false
    }
}

# ============================================================================
# PHASE 4: Update Components
# ============================================================================
elseif ($Phase -eq 4) {
    Write-Info "Validando PHASE-4: Update Components..."
    
    # 1. Verificar que DatasetsList usa hooks de React Query
    Write-Host "`n🔍 Verificando Componentes..." -ForegroundColor Yellow
    
    if (Test-Path "src\features\dataset\pages\DatasetsList.tsx") {
        $content = Get-Content "src\features\dataset\pages\DatasetsList.tsx" -Raw
        if ($content -match "useDatasets") {
            Write-Success "DatasetsList usa useDatasets"
        } else {
            Write-Error-Custom "DatasetsList NO usa useDatasets"
            $AllChecksPassed = $false
        }
        
        # Verificar que NO usa useState para data fetching
        if ($content -notmatch "useState.*dataset") {
            Write-Success "DatasetsList NO usa useState manual"
        } else {
            Write-Warning-Custom "DatasetsList todavía tiene useState (revisar si es legacy)"
        }
    }
    
    # 2. Ejecutar todos los tests
    Write-Host "`n🧪 Ejecutando Suite Completa..." -ForegroundColor Yellow
    
    npm test 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TODOS los tests pasando"
    } else {
        Write-Error-Custom "Algunos tests FALLANDO - ejecuta 'npm test' para detalles"
        $AllChecksPassed = $false
    }
    
    # 3. Verificar que no hay código legacy
    Write-Host "`n🗑️  Verificando Limpieza de Código Legacy..." -ForegroundColor Yellow
    Write-Info "Busca archivos .old o comentarios // TODO: remove legacy"
}

# ============================================================================
# PHASE 5: DatasetsList Update
# ============================================================================
elseif ($Phase -eq 5) {
    Write-Info "Validando PHASE-5: DatasetsList Update..."
    
    # 1. Verificar feature flags
    Write-Host "`n📁 Verificando Feature Flags..." -ForegroundColor Yellow
    
    if (Test-Path "src\config\features.ts") {
        Write-Success "src\config\features.ts existe"
        
        $content = Get-Content "src\config\features.ts" -Raw
        if ($content -match "DATASET_EDIT_ENABLED") {
            Write-Success "DATASET_EDIT_ENABLED definido"
        } else {
            Write-Error-Custom "DATASET_EDIT_ENABLED NO definido"
            $AllChecksPassed = $false
        }
    } else {
        Write-Error-Custom "src\config\features.ts NO ENCONTRADO"
        $AllChecksPassed = $false
    }
    
    # 2. Verificar .env.local
    if (Test-Path ".env.local") {
        Write-Success ".env.local existe"
        $content = Get-Content ".env.local" -Raw
        if ($content -match "VITE_FEATURE_DATASET_EDIT_ENABLED") {
            Write-Success "VITE_FEATURE_DATASET_EDIT_ENABLED configurado"
        }
    } else {
        Write-Warning-Custom ".env.local no existe (crear manualmente)"
    }
    
    # 3. Verificar DatasetCard
    if (Test-Path "src\features\dataset\components\DatasetCard.tsx") {
        $content = Get-Content "src\features\dataset\components\DatasetCard.tsx" -Raw
        if ($content -match "Edit2") {
            Write-Success "DatasetCard tiene botón Edit"
        } else {
            Write-Error-Custom "DatasetCard NO tiene botón Edit"
            $AllChecksPassed = $false
        }
        
        if ($content -match "BarChart3") {
            Write-Success "DatasetCard tiene botón Dashboard"
        } else {
            Write-Error-Custom "DatasetCard NO tiene botón Dashboard"
            $AllChecksPassed = $false
        }
    }
    
    # 4. Tests
    Write-Host "`n🧪 Ejecutando Tests..." -ForegroundColor Yellow
    npm test -- DatasetCard 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de DatasetCard pasando"
    } else {
        Write-Error-Custom "Tests de DatasetCard FALLANDO"
        $AllChecksPassed = $false
    }
}

# ============================================================================
# PHASE 6: DatasetDetail Edit Page
# ============================================================================
elseif ($Phase -eq 6) {
    Write-Info "Validando PHASE-6: DatasetDetail Edit Page..."
    
    # 1. Verificar dependencias
    Write-Host "`n📦 Verificando Dependencias..." -ForegroundColor Yellow
    
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.dependencies.'react-hook-form') {
        Write-Success "react-hook-form instalado"
    } else {
        Write-Error-Custom "react-hook-form NO instalado"
        $AllChecksPassed = $false
    }
    
    if ($packageJson.dependencies.'zod') {
        Write-Success "zod instalado"
    } else {
        Write-Error-Custom "zod NO instalado"
        $AllChecksPassed = $false
    }
    
    # 2. Verificar archivos
    Write-Host "`n📁 Archivos Esperados:" -ForegroundColor Yellow
    
    $files = @(
        "src\features\dataset\pages\DatasetDetail.tsx",
        "src\features\dataset\schemas\datasetEdit.schema.ts",
        "src\features\dataset\components\edit\GeneralInfoFields.tsx",
        "src\features\dataset\components\edit\GroupConfigFields.tsx",
        "src\features\dataset\components\edit\KPIFieldsTable.tsx",
        "src\features\dataset\components\edit\AIConfigFields.tsx"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 3. Tests
    Write-Host "`n🧪 Ejecutando Tests..." -ForegroundColor Yellow
    npm test -- datasetEdit.schema 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de schema pasando"
    } else {
        Write-Error-Custom "Tests de schema FALLANDO"
        $AllChecksPassed = $false
    }
}

# ============================================================================
# PHASE 7: Dashboard Templates
# ============================================================================
elseif ($Phase -eq 7) {
    Write-Info "Validando PHASE-7: Dashboard Templates..."
    
    # 1. Verificar archivos
    Write-Host "`n📁 Archivos Esperados:" -ForegroundColor Yellow
    
    $files = @(
        "src\features\dataset\types\dashboard.types.ts",
        "src\features\dataset\hooks\useDatasetDashboard.ts",
        "src\features\dataset\pages\DatasetDashboard.tsx",
        "src\features\dataset\components\dashboard\TemplateSelector.tsx",
        "src\features\dataset\components\dashboard\DashboardFiltersBar.tsx",
        "src\features\dataset\components\dashboard\KPIGrid.tsx",
        "src\features\dataset\components\dashboard\ComparisonChart.tsx",
        "src\features\dataset\components\dashboard\ComparisonTable.tsx"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 2. Verificar tipos de templates
    if (Test-Path "src\features\dataset\types\dashboard.types.ts") {
        $content = Get-Content "src\features\dataset\types\dashboard.types.ts" -Raw
        if ($content -match "sideby_executive" -and $content -match "sideby_trends" -and $content -match "sideby_detailed") {
            Write-Success "3 templates definidos (Executive, Trends, Detailed)"
        } else {
            Write-Error-Custom "Templates NO completamente definidos"
            $AllChecksPassed = $false
        }
    }
    
    # 3. Tests
    Write-Host "`n🧪 Ejecutando Tests..." -ForegroundColor Yellow
    npm test -- useDatasetDashboard 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests de useDatasetDashboard pasando"
    } else {
        Write-Error-Custom "Tests de useDatasetDashboard FALLANDO"
        $AllChecksPassed = $false
    }
}

# ============================================================================
# PHASE 8: Integration Tests E2E
# ============================================================================
elseif ($Phase -eq 8) {
    Write-Info "Validando PHASE-8: Integration Tests E2E..."
    
    # 1. Verificar MSW setup
    Write-Host "`n📦 Verificando MSW..." -ForegroundColor Yellow
    
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.devDependencies.'msw') {
        Write-Success "MSW instalado"
    } else {
        Write-Error-Custom "MSW NO instalado"
        $AllChecksPassed = $false
    }
    
    # 2. Verificar archivos de mocks
    Write-Host "`n📁 Archivos de Mocks:" -ForegroundColor Yellow
    
    $files = @(
        "src\test\mocks\handlers.ts",
        "src\test\mocks\server.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file existe"
        } else {
            Write-Error-Custom "$file NO ENCONTRADO"
            $AllChecksPassed = $false
        }
    }
    
    # 3. Ejecutar tests E2E
    Write-Host "`n🧪 Ejecutando Tests E2E..." -ForegroundColor Yellow
    
    npm test -- e2e.test 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tests E2E pasando"
    } else {
        Write-Error-Custom "Tests E2E FALLANDO"
        $AllChecksPassed = $false
    }
    
    # 4. Coverage
    Write-Host "`n📊 Verificando Coverage..." -ForegroundColor Yellow
    Write-Info "Ejecuta: npm run test:coverage -- features/dataset"
    Write-Info "Objetivo: >= 80% en todas las métricas"
}

# ============================================================================
# Resultado Final
# ============================================================================
Write-Host "`n" -NoNewline
if ($AllChecksPassed) {
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
    Write-Success "PHASE-$Phase VALIDADA EXITOSAMENTE"
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
    
    # Sugerir siguiente paso
    if ($Phase -lt 8) {
        $nextPhase = $Phase + 1
        Write-Host "`n📋 Siguiente Paso:" -ForegroundColor Cyan
        Write-Info "Ejecuta: .\validate-phase.ps1 -Phase $nextPhase (después de implementarla)"
        
        if ($Phase -eq 4) {
            Write-Host "`n🎉 ¡React Query Migration COMPLETA!" -ForegroundColor Magenta
            Write-Info "Ahora comienza RFC-004 con Phase-5"
        }
    } else {
        Write-Host "`n🎉🎉🎉 ¡TODAS LAS FASES COMPLETADAS! 🎉🎉🎉" -ForegroundColor Magenta
        Write-Info "RFC-004 Implementation COMPLETE"
        Write-Info "Ready for Production Deployment ✅"
    }
} else {
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Red
    Write-Error-Custom "PHASE-$Phase TIENE ERRORES"
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "`n🔧 Acción Requerida:" -ForegroundColor Yellow
    Write-Info "Revisa los errores arriba y corrige antes de continuar"
    Write-Info "No avances a la siguiente fase hasta resolver estos problemas"
}

Write-Host ""

# Volver al directorio original
Set-Location ..\..\..\

exit $(if ($AllChecksPassed) { 0 } else { 1 })
