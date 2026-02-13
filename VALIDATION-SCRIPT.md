# 🧪 Phase Validation Script

Script de validación automática para las 8 fases de implementación de React Query + RFC-004.

## 📖 Documentación Completa

**👉 Ver guía completa:** [`docs/design/prompts/IMPLEMENTATION-GUIDE.md`](docs/design/prompts/IMPLEMENTATION-GUIDE.md)

## ⚡ Uso Rápido

### Validar una fase

```powershell
.\validate-phase.ps1 -Phase 1
```

### Resultado Esperado

Si la fase está correctamente implementada:

```
🔍 Validando PHASE-1

📁 Archivos Esperados:
✅ src\lib\queryClient.ts existe
✅ src\test\utils\react-query.ts existe

🔍 Verificando App.tsx...
✅ App.tsx tiene QueryClientProvider
✅ App.tsx tiene ReactQueryDevtools

🧪 Ejecutando Tests...
✅ Tests de queryClient pasando

📦 Verificando Dependencias...
✅ @tanstack/react-query instalado
✅ @tanstack/react-query-devtools instalado

═══════════════════════════════════════════════
✅ PHASE-1 VALIDADA EXITOSAMENTE
═══════════════════════════════════════════════

📋 Siguiente Paso:
ℹ️  Ejecuta: .\validate-phase.ps1 -Phase 2 (después de implementarla)
```

Si hay errores:

```
❌ src\lib\queryClient.ts NO ENCONTRADO
❌ Tests de queryClient FALLANDO

═══════════════════════════════════════════════
❌ PHASE-1 TIENE ERRORES
═══════════════════════════════════════════════

🔧 Acción Requerida:
ℹ️  Revisa los errores arriba y corrige antes de continuar
```

## 🎯 Fases Disponibles

| Fase | Focus | Validación |
|------|-------|------------|
| 1 | QueryClient Setup | `.\validate-phase.ps1 -Phase 1` |
| 2 | Migrate Queries | `.\validate-phase.ps1 -Phase 2` |
| 3 | Migrate Mutations | `.\validate-phase.ps1 -Phase 3` |
| 4 | Update Components | `.\validate-phase.ps1 -Phase 4` |
| 5 | DatasetsList Update | `.\validate-phase.ps1 -Phase 5` |
| 6 | DatasetDetail Edit | `.\validate-phase.ps1 -Phase 6` |
| 7 | Dashboard Templates | `.\validate-phase.ps1 -Phase 7` |
| 8 | E2E Tests | `.\validate-phase.ps1 -Phase 8` |

## 🔧 Troubleshooting

### "No se puede ejecutar scripts en este sistema"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script no encuentra archivos

Asegúrate de ejecutar el script desde la raíz del proyecto:

```powershell
# Correcto (desde raíz):
C:\Proyectos\SideBy> .\validate-phase.ps1 -Phase 1

# Incorrecto (desde subcarpeta):
C:\Proyectos\SideBy\docs> ..\validate-phase.ps1 -Phase 1
```

## 📝 Workflow Recomendado

1. Implementa una fase con el agente
2. Ejecuta el script de validación
3. Si pasa ✅ → Commit y siguiente fase
4. Si falla ❌ → Corrige y vuelve a validar

**No avances a la siguiente fase sin validar la anterior.**

## 📚 Más Información

- **Guía completa:** [`docs/design/prompts/IMPLEMENTATION-GUIDE.md`](docs/design/prompts/IMPLEMENTATION-GUIDE.md)
- **Quick start:** [`docs/design/prompts/REACT-QUERY-START-HERE.md`](docs/design/prompts/REACT-QUERY-START-HERE.md)
- **RFC React Query:** [`docs/design/RFC-React-Query-Migration.md`](docs/design/RFC-React-Query-Migration.md)
- **RFC-004:** [`docs/design/RFC-004-DASHBOARD-TEMPLATE.md`](docs/design/RFC-004-DASHBOARD-TEMPLATE.md)

---

**¡Happy coding! 🚀**
