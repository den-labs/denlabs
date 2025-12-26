#!/usr/bin/env node

/**
 * create-snapshot.cjs
 *
 * Creates a documentation snapshot by:
 * 1. Taking current HEAD hash and date
 * 2. Moving [Unreleased] entries to a snapshot block
 * 3. Clearing [Unreleased] for next development cycle
 *
 * Usage: pnpm run doc:snapshot
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    log(`❌ Error ejecutando comando: ${command}`, "red");
    log(`   ${error.message}`, "red");
    process.exit(1);
  }
}

// Get current HEAD hash (short)
function getCurrentHead() {
  return execCommand("git rev-parse --short HEAD");
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

// Get current phase from progress.json
function getCurrentPhase() {
  const progressPath = path.join(process.cwd(), "progress.json");

  if (!fs.existsSync(progressPath)) {
    log('⚠️  progress.json no encontrado, usando "N/A"', "yellow");
    return "N/A";
  }

  try {
    const progress = JSON.parse(fs.readFileSync(progressPath, "utf-8"));
    const currentStep = progress.steps.find((s) => s.status === "in_progress");
    return currentStep ? currentStep.name : "N/A";
  } catch (_error) {
    log('⚠️  Error leyendo progress.json, usando "N/A"', "yellow");
    return "N/A";
  }
}

// Extract [Unreleased] section content
function extractUnreleasedContent(changelog) {
  const unreleasedRegex = /## \[Unreleased\]([\s\S]*?)(?=\n## |$)/;
  const match = changelog.match(unreleasedRegex);

  if (!match) {
    log("❌ No se encontró sección [Unreleased] en docs/CHANGELOG.md", "red");
    process.exit(1);
  }

  // Remove comment lines and trim
  const content = match[1]
    .split("\n")
    .filter((line) => !line.trim().startsWith("<!--"))
    .join("\n")
    .trim();

  return content;
}

// Create snapshot block
function createSnapshotBlock(hash, date, phase, unreleasedContent) {
  return `## Snapshot: ${hash} (${date})
**Estado:** Docs sincronizados con codebase
**Fase actual:** ${phase}

### Cambios incluidos en este snapshot:

${unreleasedContent}`;
}

// Update CHANGELOG.md
function updateChangelog(currentHead, currentDate, currentPhase) {
  const changelogPath = path.join(process.cwd(), "docs/CHANGELOG.md");

  if (!fs.existsSync(changelogPath)) {
    log("❌ docs/CHANGELOG.md no encontrado", "red");
    process.exit(1);
  }

  const changelog = fs.readFileSync(changelogPath, "utf-8");

  // Extract unreleased content
  const unreleasedContent = extractUnreleasedContent(changelog);

  if (!unreleasedContent || unreleasedContent.length === 0) {
    log("❌ Sección [Unreleased] está vacía.", "red");
    log("   Agrega entries antes de crear snapshot.", "yellow");
    log("\n💡 Formato de entry:", "blue");
    log("   ### [YYYY-MM-DD] - [Tipo]", "reset");
    log("   - **Archivos:** `path/to/file.ts`", "reset");
    log("   - **Cambio:** Descripción del cambio", "reset");
    log("   - **Doc drift resuelto:** CLAUDE.md § Section\n", "reset");
    process.exit(1);
  }

  // Create snapshot block
  const snapshotBlock = createSnapshotBlock(
    currentHead,
    currentDate,
    currentPhase,
    unreleasedContent,
  );

  // Find the position of [Unreleased] section
  const unreleasedIndex = changelog.indexOf("## [Unreleased]");
  if (unreleasedIndex === -1) {
    log("❌ No se encontró marcador ## [Unreleased]", "red");
    process.exit(1);
  }

  // Find the next section after [Unreleased]
  const nextSectionRegex = /\n## [^[].*$/m;
  const afterUnreleased = changelog.slice(
    unreleasedIndex + "## [Unreleased]".length,
  );
  const nextSectionMatch = afterUnreleased.match(nextSectionRegex);

  let updatedChangelog;

  if (nextSectionMatch) {
    // Insert snapshot between [Unreleased] and next section
    const insertPosition =
      unreleasedIndex + "## [Unreleased]".length + nextSectionMatch.index;
    updatedChangelog =
      changelog.slice(0, insertPosition) +
      "\n\n---\n\n" +
      snapshotBlock +
      "\n\n---\n" +
      changelog.slice(insertPosition);
  } else {
    // Append snapshot at the end
    updatedChangelog = `${changelog}\n\n---\n\n${snapshotBlock}\n`;
  }

  // Clear [Unreleased] section
  updatedChangelog = updatedChangelog.replace(
    /## \[Unreleased\][\s\S]*?---/,
    "## [Unreleased]\n\n<!-- Agrega tus entries aquí durante desarrollo -->\n<!-- Formato:\n### [YYYY-MM-DD] - [Tipo]\n- **Archivos:** `path/to/file.ts`, `path/to/file2.tsx`\n- **Cambio:** Descripción concisa del cambio principal (1-2 líneas)\n- **Doc drift resuelto:** CLAUDE.md § Section, docs/STATUS.md\n-->\n\n---",
  );

  // Write updated changelog
  fs.writeFileSync(changelogPath, updatedChangelog, "utf-8");

  return true;
}

// Main execution
function main() {
  log("\n📸 Doc Snapshot Creator", "bold");
  log("━".repeat(60), "cyan");

  log("\n❌ ERROR: Este script debe correrse en el repo denlabs-docs", "red");
  log("━".repeat(60), "red");
  log("\nLa documentación ahora vive en el repo privado denlabs-docs.", "yellow");
  log("CHANGELOG.md, STATUS.md y otros docs están allí.\n", "yellow");

  log("📝 PASOS PARA CREAR SNAPSHOT:", "bold");
  log("━".repeat(60), "cyan");
  log("   1. cd ../denlabs-docs", "blue");
  log("   2. Corre este mismo script desde ese repo", "blue");
  log("   3. El snapshot se creará en denlabs-docs/docs/CHANGELOG.md", "blue");

  log("\n💡 TIP: El snapshot referencia commits del repo denlabs (código)\n", "blue");
  process.exit(1);

  const currentHead = getCurrentHead();
  const currentDate = getCurrentDate();
  const currentPhase = getCurrentPhase();

  log(`\n🎯 HEAD:  ${currentHead}`, "cyan");
  log(`📅 Fecha: ${currentDate}`, "cyan");
  log(`📊 Fase:  ${currentPhase}`, "cyan");

  log("\n📝 Creando snapshot...", "yellow");

  try {
    updateChangelog(currentHead, currentDate, currentPhase);

    log("\n✅ Snapshot creado exitosamente!", "green");
    log("━".repeat(60), "green");
    log(`\n📌 Snapshot: ${currentHead} (${currentDate})`, "bold");
    log(`📊 Fase: ${currentPhase}`, "reset");

    log("\n📝 PRÓXIMOS PASOS:", "bold");
    log("━".repeat(60), "cyan");
    log("   1. Revisa docs/CHANGELOG.md para confirmar el snapshot", "reset");
    log("   2. Commit el changelog actualizado:", "reset");
    log(`      git add docs/CHANGELOG.md`, "blue");
    log(`      git commit -m "docs: create snapshot ${currentHead}"`, "blue");
    log(
      "   3. La sección [Unreleased] está lista para próximos cambios",
      "reset",
    );

    log(
      "\n💡 TIP: Este snapshot marca el estado sincronizado docs ↔ código\n",
      "blue",
    );
  } catch (error) {
    log(`\n❌ Error creando snapshot: ${error.message}`, "red");
    process.exit(1);
  }
}

main();
