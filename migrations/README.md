# Database Migrations

Este directorio contiene migraciones SQL versionadas para el esquema de base de datos de DenLabs.

## ¿Por qué Migraciones?

Las migraciones proporcionan:
- **Versionado de schema**: Historial completo de cambios en la estructura de DB
- **Reproducibilidad**: Setup idéntico en dev/staging/production
- **Colaboración**: Múltiples devs pueden aplicar cambios consistentemente
- **Rollback**: Capacidad de revertir cambios si es necesario

## Estructura de Archivos

```
migrations/
├── README.md                    # Este archivo
├── 001_initial_schema.sql       # Schema inicial (lab_users, event_labs, feedback_items)
└── 002_runs_and_missions.sql    # Schema de Runs y Missions (pendiente)
```

### Convención de Nombres

```
XXX_descriptive_name.sql
 │   └─ Descripción en snake_case
 └─ Número secuencial (001, 002, etc.)
```

## Tablas Incluidas

### 001_initial_schema.sql

**lab_users** - Perfiles de usuario
- Identity: handle, display_name, avatar_url
- Auth: role, wallet_address, self_verified
- Roles soportados: player (builder), organizer (run operator), sponsor (viewer)

**event_labs** - Event labs para feedback
- Identity: slug, name, objective
- Config: surfaces_to_observe, status
- Relations: creator_id → lab_users

**feedback_items** - Feedback de usuarios
- Content: message
- Context: route, step, event_type
- Trust: trust_score, trust_flags, is_self_verified
- Status: new, triaged, done, spam
- Priority: P0, P1, P2, P3

### 002_runs_and_missions.sql

**runs** - Challenges/hackathons/competitions
- Identity: slug, name, description
- Visual: icon, cover_image_url
- Config: status (draft/active/paused/completed/archived), visibility (public/private/invite_only)
- Dates: start_date, end_date
- Relations: creator_id → lab_users, lab_id → event_labs (optional)
- Metadata: JSONB for custom configuration

**missions** - Individual tasks/quests within runs
- Identity: slug, title, description
- Visual: icon
- Reward: points
- Verification: verification_type (manual/auto/proof_required/self_reported), requirements (JSONB)
- Config: status (draft/active/locked/expired), sort_order, max_completions
- Dependencies: requires_mission_id → missions (optional)
- Relations: run_id → runs

**user_mission_progress** - User progress tracking
- Relations: user_id → lab_users, mission_id → missions
- Status: started, submitted, approved, rejected
- Submission: proof_url, proof_text, submission_metadata, submitted_at
- Review: reviewed_by → lab_users, reviewed_at, review_notes
- Points: points_awarded (may differ from base for bonuses)

**user_run_stats** (VIEW) - Aggregated leaderboard stats
- Per-run stats: missions_completed, total_missions, total_points, last_activity

### Spray migrations (source of truth)

Las migraciones activas para Supabase viven en `supabase/migrations/`.
La migración de Spray está definida en `supabase/migrations/20260115090000_sprays_events.sql`.

## Cómo Aplicar Migraciones

### Opción 1: Supabase Dashboard (Recomendado para primeras migraciones)

1. Ir a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Navegar a **SQL Editor**
3. Copiar y pegar el contenido de `001_initial_schema.sql`
4. Click en **Run** (o `Cmd/Ctrl + Enter`)
5. Verificar que no haya errores

### Opción 2: Supabase CLI (Recomendado para desarrollo)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login a Supabase
supabase login

# 3. Link a tu proyecto
supabase link --project-ref your-project-ref

# 4. Aplicar migración
supabase db push migrations/001_initial_schema.sql

# 5. Verificar status
supabase db status
```

### Opción 3: psql (Para usuarios avanzados)

```bash
# Usando connection string de Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres" \
  -f migrations/001_initial_schema.sql
```

## Verificar Migración Aplicada

Después de aplicar una migración, verifica que las tablas existan:

```sql
-- Lista todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verifica estructura de una tabla específica
\d lab_users
\d event_labs
\d feedback_items
```

Deberías ver las 3 tablas listadas.

## Crear Nueva Migración

Cuando necesites agregar/modificar el schema:

1. **Crea nuevo archivo con número secuencial:**
   ```bash
   touch migrations/003_add_user_settings.sql
   ```

2. **Escribe el SQL:**
   ```sql
   -- =====================================================
   -- Migration: 003_add_user_settings.sql
   -- Description: Add user_settings table
   -- Created: YYYY-MM-DD
   -- =====================================================

   CREATE TABLE user_settings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES lab_users(id) ON DELETE CASCADE,
     -- ... rest of schema
   );
   ```

3. **Incluye rollback (opcional pero recomendado):**
   ```sql
   -- ROLLBACK:
   -- DROP TABLE IF EXISTS user_settings CASCADE;
   ```

4. **Documenta en este README:**
   - Agrega descripción de la nueva tabla
   - Actualiza sección "Tablas Incluidas"

## Rollback de Migraciones

Si necesitas revertir una migración:

### Método 1: SQL Manual

Cada migración puede incluir comentarios de rollback al final:

```sql
-- Para revertir esta migración, ejecuta:
-- DROP TABLE IF EXISTS feedback_items CASCADE;
-- DROP TABLE IF EXISTS event_labs CASCADE;
-- DROP TABLE IF EXISTS lab_users CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Método 2: Supabase Time Travel (Pro plan)

Supabase Pro permite restaurar a un punto en el tiempo anterior.

## Seed Data (Datos Iniciales)

Para poblar la DB con datos de prueba:

```bash
# Crear archivo de seed
touch migrations/seed_dev_data.sql
```

Ejemplo de seed:

```sql
-- Insertar usuario de prueba
INSERT INTO lab_users (handle, display_name, role, wallet_address, self_verified)
VALUES
  ('test-builder', 'Test Builder', 'player', '0x1234...', true),
  ('test-organizer', 'Test Organizer', 'organizer', '0x5678...', true);

-- Insertar lab de prueba
INSERT INTO event_labs (slug, name, creator_id, start_date)
SELECT 'test-lab', 'Test Lab', id, NOW()
FROM lab_users WHERE handle = 'test-organizer';
```

**Nota:** No commitees seed data sensible o de producción al repositorio.

## Troubleshooting

### Error: "relation already exists"

La tabla ya existe. Opciones:
- Si es desarrollo local: `DROP TABLE <name> CASCADE;` y reaplica
- Si es producción: Crea nueva migración para ALTER TABLE

### Error: "permission denied"

Verifica que estés usando el service role key de Supabase, no la anon key.

### Error: "syntax error at or near..."

Revisa la sintaxis SQL. Common issues:
- Falta `;` al final de statements
- Comillas incorrectas (usa `'` para strings, `"` para identifiers)
- Palabras reservadas sin escapar

## Best Practices

1. **Nunca modifiques migraciones ya aplicadas**
   - Crea nueva migración para correcciones
   - Mantén el historial inmutable

2. **Usa transacciones en migraciones complejas**
   ```sql
   BEGIN;
   -- Tus cambios aquí
   COMMIT;
   -- Si algo falla, ejecuta: ROLLBACK;
   ```

3. **Agrega indexes para queries comunes**
   - Foreign keys siempre deben tener índices
   - Columnas usadas en WHERE/ORDER BY

4. **Documenta cambios significativos**
   - Usa COMMENT ON para documentar propósito de columnas
   - Explica decisiones de diseño en comentarios SQL

5. **Test migraciones localmente primero**
   - Aplica en DB de desarrollo
   - Verifica que la app funcione
   - Luego aplica en staging/producción

## Estado Actual

### Migraciones Aplicadas

- ✅ **001_initial_schema.sql** - Schema inicial (lab_users, event_labs, feedback_items)

### Migraciones Listas para Aplicar

- ✅ **002_runs_and_missions.sql** - Schema de Runs y Missions (runs, missions, user_mission_progress, user_run_stats view)
- ✅ **20260115090000_sprays_events.sql** - Schema de Spray (sprays, spray_events)

## Recursos

- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)

## Soporte

Si tienes problemas con migraciones:
1. Revisa la sección Troubleshooting arriba
2. Consulta logs de Supabase Dashboard
3. Pregunta al equipo en Slack/Discord
