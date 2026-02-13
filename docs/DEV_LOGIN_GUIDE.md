# 🔧 GUÍA: Cómo probar endpoints protegidos de Datasets

## Problema
Los endpoints de datasets requieren autenticación JWT pero no tenés un token.

## Solución: Endpoint de desarrollo `/api/v1/auth/dev-login`

### 📌 Paso 1: Generar token JWT

**Request:**
```bash
POST http://localhost:3000/api/v1/auth/dev-login
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User",
  "role": "user"
}
```

**Usando cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"user"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test@example.com",
      "name": "Test User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczOTE5MTIwMCwiZXhwIjoxNzM5Nzk2MDAwfQ.xxxxxxxxxxxx"
  }
}
```

### 📌 Paso 2: Usar el token en requests

**Ejemplo 1: Listar datasets**
```bash
GET http://localhost:3000/api/v1/datasets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usando cURL:**
```bash
curl http://localhost:3000/api/v1/datasets \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>"
```

**Ejemplo 2: Upload de datasets**
```bash
POST http://localhost:3000/api/v1/datasets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

fileA: <archivo1.csv>
fileB: <archivo2.csv>
labelA: "Ventas 2024"
labelB: "Ventas 2023"
colorA: "#3b82f6"
colorB: "#f59e0b"
```

**Usando cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/datasets \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>" \
  -F "fileA=@path/to/file1.csv" \
  -F "fileB=@path/to/file2.csv" \
  -F "labelA=Ventas 2024" \
  -F "labelB=Ventas 2023"
```

---

## 🎯 Opciones del endpoint dev-login

### Crear usuario normal:
```json
{
  "email": "user@test.com"
}
```
- Si no especificás `name`, usa la parte antes del @ del email
- Si no especificás `role`, usa `"user"` por defecto

### Crear usuario admin:
```json
{
  "email": "admin@test.com",
  "name": "Admin User",
  "role": "admin"
}
```

---

## 🛠️ Uso con Swagger UI

1. **Abrí Swagger:** http://localhost:3000/api/docs
2. **Buscá:** "Auth (Development Only)" → POST /api/v1/auth/dev-login
3. **Ejecutá:** Click en "Try it out"
4. **Ingresá:** 
   ```json
   {
     "email": "test@example.com"
   }
   ```
5. **Copiá el token** de la respuesta
6. **Autenticá Swagger:**
   - Click en el botón "Authorize" arriba a la derecha
   - Ingresá: `Bearer <TU_TOKEN>`
   - Click "Authorize"
7. **Probá los endpoints de Datasets** ✅

---

## ⚠️ IMPORTANTE

- Este endpoint **SOLO funciona en desarrollo** (NODE_ENV !== "production")
- El usuario se crea automáticamente si no existe
- El token expira en 7 días (configurable con JWT_EXPIRES_IN)
- **NO USAR EN PRODUCCIÓN** - Está bloqueado automáticamente

---

## 🔄 Obtener nuevo token

Si tu token expiró o lo perdiste, simplemente volvé a llamar al endpoint con el mismo email:

```bash
POST http://localhost:3000/api/v1/auth/dev-login
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

## 📝 Testing automatizado

### Script de ejemplo (Node.js):
```javascript
// 1. Obtener token
const loginRes = await fetch('http://localhost:3000/api/v1/auth/dev-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
});

const { data: { token } } = await loginRes.json();

// 2. Usar token en requests
const datasetsRes = await fetch('http://localhost:3000/api/v1/datasets', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const datasets = await datasetsRes.json();
console.log(datasets);
```

---

## 🐛 Troubleshooting

### Error 403: "Dev login endpoint is disabled in production"
- **Causa:** NODE_ENV está en "production"
- **Solución:** Verificá que estés en modo desarrollo

### Error 400: "Email is required"
- **Causa:** Falta el campo `email` en el body
- **Solución:** Asegurate de enviar `{"email": "..."}`

### Error 401 en endpoints protegidos
- **Causa:** Token inválido o expirado
- **Solución:** Generá un nuevo token con `/dev-login`
