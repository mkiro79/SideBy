## Convención simple de versiones (MVP)

Usa **SemVer** con ramas de release:

- **Formato de rama:** `release/x.y.z`
- **MAJOR (x):** cambios incompatibles (breaking changes)
- **MINOR (y):** nuevas funcionalidades compatibles
- **PATCH (z):** fixes sin romper compatibilidad

### Reglas prácticas
- Rama release siempre desde `main`.
- Una release = una versión cerrada (`release/1.4.0`).
- Hotfix urgente:
  - si aún no publicaste: sobre la misma `release/x.y.z`
  - si ya publicaste: nueva `release/x.y.(z+1)` (ej. `release/1.4.1`)
- Nunca reutilizar un nombre de release ya creado.

---

## Checklist de 5 pasos para publicar sin errores

1. **Crear rama release**
   - Desde Actions: `Release CI/CD` → `create_release_branch=true` → `release_branch_name=release/x.y.z` → source `main`.

2. **Congelar cambios**
   - Solo aceptar fixes críticos en la rama de release.
   - No meter features nuevas.

3. **Validar quality gates**
   - Confirmar checks en verde (`Quality Gates`) en PR y/o commits de la release.
   - Si falla algo, corregir y volver a ejecutar.

4. **Preparar versión**
   - Actualizar changelog de la versión.
   - Revisar impacto final (API/Client) y smoke test básico.

5. **Publicar y cerrar**
   - Merge de `release/x.y.z` a `main` por PR.
   - Crear tag/release de GitHub con la misma versión (`vX.Y.Z`).
   - (Opcional recomendado) merge/back-merge a rama de desarrollo si la usan.

---

## Qué hacer si “Quality Gates” no aparece como required check

- Ejecutar una corrida completa del workflow en `main` (manual o por PR).
- Esperar 1–3 minutos y refrescar Rulesets.
- Agregar el check del **job** `Quality Gates` (no solo el nombre del workflow).
- Guardar la ruleset.