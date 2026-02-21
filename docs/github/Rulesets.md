## ✅ Configuración de Rulesets (Main + Release) para SideBy

### 1) Ruleset para `main`

1. Ir a **GitHub → Settings → Rules → Rulesets → New branch ruleset**.
2. **Ruleset Name**: `protect-main-quality-gates`.
3. **Enforcement status**: `Active`.
4. En **Target branches** agregar:
   - `main` (o **Include default branch**).
5. Activar:
   - **Require a pull request before merging**
   - **Require status checks to pass**
   - **Require branches to be up to date before merging** (recomendado)
   - **Block force pushes**
   - **Block deletions**
6. En **Required status checks** agregar:
   - `Quality Gates`
7. **Bypass list**:
   - MVP recomendado: vacío.
8. Guardar la ruleset.

---

### 2) Ruleset para `release/**`

1. Ir a **GitHub → Settings → Rules → Rulesets → New branch ruleset**.
2. **Ruleset Name**: `protect-release-quality-gates`.
3. **Enforcement status**: `Active`.
4. En **Target branches** agregar patrón:
   - `release/**`
5. Activar:
   - **Require a pull request before merging**
   - **Require status checks to pass**
   - **Require branches to be up to date before merging** (recomendado)
   - **Block force pushes**
   - **Block deletions**
6. En **Required status checks** agregar:
   - `Quality Gates`
7. **Bypass list**:
   - MVP recomendado: vacío.
8. Guardar la ruleset.

---

## 🚀 Cómo se utiliza (cuándo se dispara)

El workflow **Release CI/CD** se dispara en:

- **push** a `main` y `release/**`
- **pull_request** hacia `main` y `release/**`
- **manual (workflow_dispatch)** desde Actions

Uso manual típico:
1. Ir a **Actions → Release CI/CD → Run workflow**.
2. Elegir rama `main`.
3. Para solo validar CI: `create_release_branch = false`.
4. Para crear rama release:
   - `create_release_branch = true`
   - `release_branch_name = release/x.y.z`
   - `source_branch = main` (o la que corresponda)

---

## 🛠️ Si aparecen “sugerencias” de Quality Gates pero no se puede agregar

Esto pasa cuando GitHub aún no indexó checks o no hay ejecución válida reciente.

### Solución rápida

1. Confirmar que el workflow está en `main` (commit + push).
2. Ejecutar una vez **Release CI/CD** en `main` con `create_release_branch = false`.
3. Esperar a que termine en **success**.
4. Volver a la ruleset → **Add checks** → seleccionar `Quality Gates`.
5. Si no aparece:
   - refrescar página
   - esperar 1–3 min
   - volver a abrir selector
6. Si sigue sin aparecer:
   - crear una rama de prueba
   - abrir PR a `main`
   - dejar correr checks
   - regresar a ruleset y agregar `Quality Gates`.

> Importante: el check requerido debe ser el **job** `Quality Gates`, no el nombre del workflow completo.