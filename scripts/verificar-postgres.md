# Verificar PostgreSQL

## 1. ¿Está corriendo PostgreSQL?

**Si usás el puerto por defecto (5432):**
```bash
# Ver si responde el puerto
nc -z localhost 5432 && echo "PostgreSQL escuchando en 5432" || echo "No hay nada en 5432"
```

**Si usás Docker / puerto 54320 (como en .env.example):**
```bash
nc -z localhost 54320 && echo "PostgreSQL escuchando en 54320" || echo "No hay nada en 54320"
```

O con `psql` (si lo tenés instalado):
```bash
psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "SELECT 1"
# Si tu .env usa puerto 54320:
psql "postgresql://postgres:postgres@localhost:54320/postgres" -c "SELECT 1"
```

---

## 2. Crear la base `farmacia` si no existe

Conectate a la base por defecto (`postgres`) y creá la base:

```bash
# Puerto 5432 (PostgreSQL instalado en la Mac)
psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "CREATE DATABASE farmacia;"

# Puerto 54320 (Docker)
psql "postgresql://postgres:postgres@localhost:54320/postgres" -c "CREATE DATABASE farmacia;"
```

Si la base ya existe, vas a ver un error tipo "already exists"; está bien.

---

## 3. Probar que la app conecte

```bash
psql "$DATABASE_URL" -c "SELECT 1"
```

O reemplazando con tu URL:
```bash
psql "postgresql://postgres:postgres@localhost:54320/farmacia" -c "SELECT 1"
```

Si responde con una fila con `1`, la base está bien.

---

## 4. Si no tenés PostgreSQL: levantar con Docker

```bash
docker run -d --name postgres-farmacia \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=farmacia \
  -p 54320:5432 \
  postgres:16
```

En tu `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:54320/farmacia
```

Luego:
```bash
npm run start:dev
```
