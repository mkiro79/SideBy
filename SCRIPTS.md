   # Scripts PowerShell para SideBy

Scripts para facilitar la ejecución y testing de la aplicación SideBy.

## Requisitos Previos

- **PowerShell 5.1+** (viene por defecto en Windows)
- **Docker Desktop** instalado y en ejecución
- **npm** instalado (Node.js)

## start-app.ps1

Script para arrancar toda la aplicación con Docker Compose.

### Uso

```powershell
.\start-app.ps1
```

### Qué hace

- [OK] Verifica que Docker y Docker Compose estén instalados
- [*] Instala dependencias si es necesario
- [*] Inicia todos los servicios con Docker Compose:
  - MongoDB (puerto 27017)
  - Mongo Express (puerto 8081)
  - API (puerto 3000)
  - Cliente React (puerto 5173)

### URLs después de ejecutar

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Cliente | http://localhost:5173 | - |
| API | http://localhost:3000 | - |
| Mongo Express | http://localhost:8081 | Usuario/contraseña desde `.env` (`ME_BASICAUTH_USERNAME` / `ME_BASICAUTH_PASSWORD`) |

### Comandos útiles con la app corriendo

```powershell
# Ver todos los logs
docker compose logs -f

# Ver logs solo de la API
docker compose logs -f api

# Ver logs solo del cliente
docker compose logs -f client

# Ver estado de los servicios
docker compose ps

# Detener la aplicación
docker compose down

# Reiniciar un servicio específico
docker compose restart api
```

---

## run-tests.ps1

Script para ejecutar todos los tests de la aplicación (API y cliente).

### Uso

```powershell
.\run-tests.ps1
```

### Qué hace

- [OK] Verifica que npm esté instalado
- [*] Instala dependencias si es necesario
- [*] Ejecuta tests de la **API** (Vitest)
- [*] Ejecuta tests del **Cliente** (Vitest + React Testing Library)
- [*] Muestra un resumen final de resultados

### Salida esperada

```
[OK] Todos los tests pasaron correctamente!
```

o

```
[-] 1 de 2 suites tuvieron fallos
```

### Ejecutar tests con coverage

Para ver cobertura de código, ejecuta esto manualmente:

```powershell
# API
cd solution-sideby/apps/api
npm run test:coverage

# Cliente
cd ..\client
npm run test:coverage
```

---

## Notas Importantes

### Permisos de ejecución

Si PowerShell no te permite ejecutar los scripts, ejecuta esto UNA SOLA VEZ:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Flujo recomendado de desarrollo

1. Abre una terminal PowerShell y ejecuta:
   ```powershell
   .\start-app.ps1
   ```

2. En otra terminal (mientras la app corre), ejecuta tests cuando quieras:
   ```powershell
   .\run-tests.ps1
   ```

3. Usa `docker compose logs -f` para debuggear issues en tiempo real

### Troubleshooting

#### Docker Compose no funciona
```powershell
# Verifica que Docker está corriendo
docker ps

# Verifica que .env exista
ls .env
```

#### Tests fallan pero la app corre bien
- Revisa los logs en la terminal donde corre `start-app.ps1`
- Verifica que MongoDB está corriendo: `docker compose logs mongo`

#### Puerto 3000 o 5173 ya en uso
```powershell
# Detén los servicios
docker compose down

# Espera 10 segundos
Start-Sleep -Seconds 10

# Inicia de nuevo
.\start-app.ps1
```

---

## Customización

Si quieres modificar los scripts, revisa estas variables:

**start-app.ps1:**
- Tiempo de espera: línea con `Start-Sleep -Seconds 15`
- Puerto de API: ver `docker-compose.yml`

**run-tests.ps1:**
- Comandos de test: usa `npm run test:run` para modo no-interactivo
- Para watch mode: cambia `test:run` por `test`

---

Hecho para SideBy.

