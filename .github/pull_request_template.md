# Pull Request

## 🎯 Tipo de cambio
- [ ] Feature (nueva funcionalidad)
- [ ] Fix (corrección de bug)
- [ ] Refactor (cambio sin alterar funcionalidad)
- [ ] Docs (solo documentación)
- [ ] Config (tooling, deps, settings)

## 📝 Descripción
<!-- Resumen conciso del cambio -->

## 🧪 Testing
- [ ] Build pasa (`pnpm run build`)
- [ ] Lint pasa (`pnpm run lint`)
- [ ] Probado manualmente en desktop
- [ ] Probado manualmente en mobile
- [ ] Flows afectados: <!-- /access, /lab, /spray, etc. -->

---

## 📚 Doc Checklist (OBLIGATORIO)

### ✅ Documentation Delta Check
**REQUIRED:** Run `pnpm run doc:delta` before submitting this PR.

**Doc Delta Report:**
- [ ] ✅ Ejecuté `pnpm run doc:delta`
- [ ] ✅ Adjunté o revisé `docs/DOC_DELTA_REPORT.md`
- [ ] No hay cambios funcionales detectados (delta limpio)

**Archivos que modifiqué en este PR:**
<!-- Lista los archivos principales que tocaste -->
- `path/to/file1.ts`
- `path/to/file2.tsx`

### 📝 Documentation PR (denlabs-docs - Private Repo)

**CRITICAL:** Documentation now lives in the private `denlabs-docs` repository.

**Docs PR Link:**
<!-- REQUIRED for functional changes. Link to your PR in denlabs-docs or explain why not needed -->
- Docs PR: <!-- [Link to denlabs-docs PR] OR "N/A - no functional changes" -->

**Documentos que actualicé en denlabs-docs:**
<!-- Marca los que aplicaron en el repo privado -->
- [ ] ✅ docs/STATUS.md (cambios funcionales: rutas/features/APIs/env vars)
- [ ] ✅ docs/CHANGELOG.md § Unreleased
- [ ] ✅ CLAUDE.md § Architecture & Structure
- [ ] ✅ CLAUDE.md § API Routes / State Management / Data Models / Environment Variables
- [ ] ✅ PROJECT_FLOW.md § "Dónde me quedé"
- [ ] ✅ progress.json (si cambió fase/step)
- [ ] ✅ docs/structure.md
- [ ] ✅ docs/spray-console.md / docs/gooddolar.md u otros módulos
- [ ] N/A - Ninguno de los doc targets aplica

**Nota:** Si no tienes acceso a `denlabs-docs`, solicita acceso a los maintainers antes de mergear este PR.

---

## 📋 Changelog Entry (in denlabs-docs)

Copia el formato de `denlabs-docs/docs/CHANGELOG.md` § Unreleased y pega tu entry aquí:

```markdown
### [YYYY-MM-DD] - [Tipo]
- **Archivos:** `src/path/file.ts`, `src/path/file2.tsx`
- **Cambio:** Descripción corta del cambio principal (1-2 líneas)
- **Doc drift resuelto:** CLAUDE.md § Section, docs/STATUS.md
- **Code commit:** [hash del commit en denlabs repo]
```

**Mi entry:**
<!-- Pega aquí tu changelog entry que irá en denlabs-docs/docs/CHANGELOG.md -->

---

## 🔗 Contexto
<!-- Link a issue, PROJECT_FLOW step, o contexto adicional -->

---

## ✅ Pre-merge Checklist

Antes de marcar ready for review:

1. [ ] Ejecuté `pnpm run doc:delta` y revisé los doc targets
2. [ ] Si hay cambios funcionales: creé PR en `denlabs-docs` y lo linké arriba
3. [ ] `pnpm run lint` pasa sin errores
4. [ ] `pnpm run build` pasa sin errores
5. [ ] Agregué mi entry en `denlabs-docs/docs/CHANGELOG.md` § Unreleased (si hay delta)
6. [ ] Revisé que los cambios no introducen vulnerabilidades (XSS, SQL injection, etc.)
7. [ ] Copy/UX revisado (clear, friendly, builder-first mindset)
8. [ ] No commits con secretos, API keys, o información sensible
