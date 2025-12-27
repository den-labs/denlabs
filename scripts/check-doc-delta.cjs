#!/usr/bin/env node

/**
 * check-doc-delta.cjs
 *
 * Detects documentation drift by comparing current HEAD with last documented snapshot.
 * Suggests doc targets based on changed files using docs/DOC_TARGETS.json.
 *
 * Usage: pnpm run doc:delta
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
  } catch (_error) {
    return "";
  }
}

// Find denlabs-docs repo location
function findDocsRepo() {
  // 1. Check environment variable first
  if (process.env.DENLABS_DOCS_PATH) {
    const envPath = path.resolve(process.env.DENLABS_DOCS_PATH);
    if (fs.existsSync(path.join(envPath, "docs/CHANGELOG.md"))) {
      return envPath;
    }
    log(
      `⚠️  DENLABS_DOCS_PATH apunta a ${envPath} pero no se encontró docs/CHANGELOG.md`,
      "yellow",
    );
  }

  // 2. Try fallback locations
  const fallbackPaths = [
    path.join(process.cwd(), "../denlabs-docs"),
    path.join(process.cwd(), "../../denlabs-docs"),
    path.join(process.cwd(), "./denlabs-docs"),
  ];

  for (const docsPath of fallbackPaths) {
    if (fs.existsSync(path.join(docsPath, "docs/CHANGELOG.md"))) {
      return docsPath;
    }
  }

  return null;
}

// Read or write local snapshot cache
function getLocalSnapshot() {
  const snapshotFile = path.join(process.cwd(), "docs/LAST_SNAPSHOT.txt");
  if (fs.existsSync(snapshotFile)) {
    return fs.readFileSync(snapshotFile, "utf-8").trim();
  }
  return null;
}

function saveLocalSnapshot(hash) {
  const snapshotFile = path.join(process.cwd(), "docs/LAST_SNAPSHOT.txt");
  fs.writeFileSync(snapshotFile, hash, "utf-8");
}

// Read last snapshot from CHANGELOG.md (now in denlabs-docs repo)
// Returns: { hash, source } where source is "changelog" | "local" | "unknown"
function getLastSnapshot() {
  const docsRepoPath = findDocsRepo();

  // Try to read from denlabs-docs CHANGELOG
  if (docsRepoPath) {
    const changelogPath = path.join(docsRepoPath, "docs/CHANGELOG.md");
    try {
      const changelog = fs.readFileSync(changelogPath, "utf-8");
      const snapshotMatch = changelog.match(/## Snapshot: ([a-f0-9]{7})/);

      if (snapshotMatch) {
        const hash = snapshotMatch[1];
        // Update local cache when we can read from changelog
        saveLocalSnapshot(hash);
        return { hash, source: "changelog" };
      }
    } catch (_error) {
      log(`⚠️  Error leyendo CHANGELOG desde ${changelogPath}`, "yellow");
    }
  }

  // Fallback to local snapshot cache
  const localSnapshot = getLocalSnapshot();
  if (localSnapshot) {
    log(
      "⚠️  No se encontró denlabs-docs, usando snapshot local cacheado",
      "yellow",
    );
    return { hash: localSnapshot, source: "local" };
  }

  // Ultimate fallback: use current HEAD and warn
  log("⚠️  No se encontró denlabs-docs ni snapshot local", "yellow");
  log(
    "   Usando HEAD actual como referencia (delta puede no ser preciso)",
    "yellow",
  );
  return { hash: getCurrentHead(), source: "unknown" };
}

// Get current HEAD hash
function getCurrentHead() {
  return execCommand("git rev-parse --short HEAD");
}

// Check if there's a delta between snapshot and HEAD
function checkDelta(snapshot, _head) {
  const diffStat = execCommand(`git diff ${snapshot}..HEAD --stat`);
  return diffStat.trim();
}

// Get list of changed files
function getChangedFiles(snapshot, _head) {
  const output = execCommand(`git diff ${snapshot}..HEAD --name-only`);
  return output.split("\n").filter(Boolean);
}

// Load doc targets mapping
function loadDocTargets() {
  const targetsPath = path.join(process.cwd(), "docs/DOC_TARGETS.json");

  if (!fs.existsSync(targetsPath)) {
    log(
      "⚠️  docs/DOC_TARGETS.json no encontrado, usando mapeo básico",
      "yellow",
    );
    return { mappings: [], functionalChangeIndicators: { patterns: [] } };
  }

  try {
    return JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  } catch (error) {
    log("❌ Error parseando docs/DOC_TARGETS.json", "red");
    log(`   ${error.message}`, "red");
    process.exit(1);
  }
}

// Generate delta report for inclusion in PR
function generateDeltaReport(snapshotInfo, head, analysis, docsRepoFound) {
  const date = new Date().toISOString();
  const { hash: snapshot, source } = snapshotInfo;

  let snapshotSourceText = "";
  if (source === "changelog") {
    snapshotSourceText = "from denlabs-docs changelog";
  } else if (source === "local") {
    snapshotSourceText = "from local cache (docs/LAST_SNAPSHOT.txt)";
  } else {
    snapshotSourceText = "unknown (using current HEAD)";
  }

  let report = `# Documentation Delta Report

**Generated:** ${date}
**Current HEAD:** ${head}
**Last Snapshot:** ${snapshot} (${snapshotSourceText})
**Docs Repo Found:** ${docsRepoFound ? "Yes" : "No"}

## Summary

`;

  if (!docsRepoFound) {
    report += `⚠️ **Warning:** Private repo \`denlabs-docs\` not found.\n`;
    report += `- Set \`DENLABS_DOCS_PATH\` environment variable, or\n`;
    report += `- Clone \`denlabs-docs\` to \`../denlabs-docs\`, \`../../denlabs-docs\`, or \`./denlabs-docs\`\n\n`;
  }

  if (analysis.hasFunctionalChanges) {
    report += `⚠️ **Functional changes detected** - Documentation update required in private repo \`denlabs-docs\`\n\n`;
  } else {
    report += `✅ No functional changes detected\n\n`;
  }

  if (analysis.matchedFiles.length > 0) {
    report += `## Changed Files\n\n`;
    analysis.matchedFiles.forEach(({ file, description }) => {
      report += `- \`${file}\`\n  - ${description}\n`;
    });
    report += `\n`;
  }

  if (analysis.targets.length > 0) {
    report += `## Documentation Targets (denlabs-docs repo)\n\n`;
    report += `The following documentation files should be reviewed and updated:\n\n`;
    analysis.targets.forEach((target) => {
      report += `- [ ] ${target}\n`;
    });
    report += `\n`;
  }

  report += `## Action Required\n\n`;

  if (!docsRepoFound) {
    report += `### Setup Documentation Repository\n\n`;
    report += `1. Clone the private \`denlabs-docs\` repository\n`;
    report += `2. Place it at \`../denlabs-docs\` (recommended) or set \`DENLABS_DOCS_PATH\`\n`;
    report += `3. Re-run \`pnpm doc:delta\` to get accurate snapshot comparison\n\n`;
    report += `### OR\n\n`;
  }

  report += `1. Create a PR in the private \`denlabs-docs\` repository\n`;
  report += `2. Update the documentation targets listed above\n`;
  report += `3. Add an entry to \`docs/CHANGELOG.md\` § [Unreleased]\n`;
  report += `4. Link the docs PR in your code PR description\n`;
  report += `\n`;
  report += `### PR Template Requirement\n\n`;
  report += `Include in your PR:\n`;
  report += `- **Docs PR (denlabs-docs):** [link to PR] or "N/A (no functional changes)"\n`;
  report += `- **Attach this report** to demonstrate doc delta awareness\n`;

  return report;
}

// Analyze changed files and suggest doc targets
function analyzeChanges(changedFiles, docTargets) {
  const targets = new Set();
  const matchedFiles = [];
  let hasFunctionalChanges = false;

  // Check for functional changes
  const functionalPatterns =
    docTargets.functionalChangeIndicators?.patterns || [];

  changedFiles.forEach((file) => {
    let fileMatched = false;

    // Check if file matches any mapping pattern
    docTargets.mappings.forEach((mapping) => {
      const regex = new RegExp(mapping.pattern);
      if (regex.test(file)) {
        mapping.targets.forEach((target) => {
          targets.add(target);
        });
        if (!fileMatched) {
          matchedFiles.push({ file, description: mapping.description });
          fileMatched = true;
        }
      }
    });

    // Check for functional changes
    functionalPatterns.forEach((pattern) => {
      const regex = new RegExp(pattern);
      if (regex.test(file)) {
        hasFunctionalChanges = true;
      }
    });
  });

  // Add STATUS.md in private repo if functional changes detected
  if (hasFunctionalChanges) {
    targets.add("denlabs-docs/docs/STATUS.md");
  }

  return {
    targets: Array.from(targets).sort(),
    matchedFiles,
    hasFunctionalChanges,
  };
}

// Main execution
function main() {
  log("\n🔍 Doc Delta Checker", "bold");
  log("━".repeat(60), "cyan");

  const docsRepoPath = findDocsRepo();
  const docsRepoFound = docsRepoPath !== null;

  if (!docsRepoFound) {
    log("\n⚠️  Repo privado denlabs-docs no encontrado", "yellow");
    log(
      "   Buscado en: ../denlabs-docs, ../../denlabs-docs, ./denlabs-docs",
      "yellow",
    );
    log("   Set DENLABS_DOCS_PATH para especificar ubicación custom", "yellow");
    log("   Usando snapshot local cacheado si existe\n", "yellow");
  }

  const snapshotInfo = getLastSnapshot();
  const currentHead = getCurrentHead();

  log(
    `\n📸 Último snapshot: ${snapshotInfo.hash} (${snapshotInfo.source})`,
    "cyan",
  );
  log(`🎯 HEAD actual:     ${currentHead}`, "cyan");

  if (snapshotInfo.hash === currentHead) {
    log("\n✅ No hay delta. Docs sincronizados con HEAD.", "green");
    if (snapshotInfo.source === "changelog") {
      log(
        "💡 Este es el estado documentado en denlabs-docs/docs/CHANGELOG.md",
        "blue",
      );
    }

    // Still generate report even with no delta
    const reportPath = path.join(process.cwd(), "docs/DOC_DELTA_REPORT.md");
    const report = generateDeltaReport(
      snapshotInfo,
      currentHead,
      { targets: [], matchedFiles: [], hasFunctionalChanges: false },
      docsRepoFound,
    );
    fs.writeFileSync(reportPath, report, "utf-8");
    log("📄 Reporte generado: docs/DOC_DELTA_REPORT.md\n", "green");
    process.exit(0);
  }

  const diffStat = checkDelta(snapshotInfo.hash, currentHead);

  if (!diffStat) {
    log("\n✅ No hay delta. Docs sincronizados.", "green");

    // Still generate report
    const reportPath = path.join(process.cwd(), "docs/DOC_DELTA_REPORT.md");
    const report = generateDeltaReport(
      snapshotInfo,
      currentHead,
      { targets: [], matchedFiles: [], hasFunctionalChanges: false },
      docsRepoFound,
    );
    fs.writeFileSync(reportPath, report, "utf-8");
    log("📄 Reporte generado: docs/DOC_DELTA_REPORT.md\n", "green");
    process.exit(0);
  }

  log("\n⚠️  DELTA DETECTADO:", "yellow");
  log("━".repeat(60), "yellow");
  console.log(diffStat);

  const changedFiles = getChangedFiles(snapshotInfo.hash, currentHead);
  const docTargets = loadDocTargets();
  const analysis = analyzeChanges(changedFiles, docTargets);

  if (analysis.matchedFiles.length > 0) {
    log("\n📂 Archivos modificados relevantes:", "cyan");
    analysis.matchedFiles.forEach(({ file, description }) => {
      log(`   • ${file}`, "reset");
      log(`     └─ ${description}`, "blue");
    });
  }

  if (analysis.hasFunctionalChanges) {
    log(
      "\n🚨 Cambios funcionales detectados (rutas/features/APIs/env vars)",
      "yellow",
    );
    log(
      "   → STATUS.md en repo privado denlabs-docs debe actualizarse",
      "yellow",
    );
  }

  // Generate DOC_DELTA_REPORT.md
  const reportPath = path.join(process.cwd(), "docs/DOC_DELTA_REPORT.md");
  const report = generateDeltaReport(
    snapshotInfo,
    currentHead,
    analysis,
    docsRepoFound,
  );
  fs.writeFileSync(reportPath, report, "utf-8");
  log(`\n📄 Reporte generado: docs/DOC_DELTA_REPORT.md`, "green");

  if (analysis.targets.length > 0) {
    log("\n📚 DOCS QUE DEBES REVISAR (en repo privado denlabs-docs):", "bold");
    log("━".repeat(60), "cyan");
    analysis.targets.forEach((target) => {
      log(`   • ${target}`, "green");
    });
  } else {
    log("\n📝 No se encontraron doc targets específicos", "yellow");
    log("   Consulta docs/DOC_TARGETS.md manualmente", "yellow");
  }

  log("\n📝 PRÓXIMOS PASOS:", "bold");
  log("━".repeat(60), "cyan");

  if (!docsRepoFound) {
    log("   1. Clona denlabs-docs o set DENLABS_DOCS_PATH", "yellow");
    log("   2. Re-corre pnpm doc:delta para snapshot preciso", "yellow");
    log("   3. Luego sigue los pasos normales abajo:", "yellow");
  }

  log("   1. Revisa docs/DOC_DELTA_REPORT.md para detalles", "reset");
  log(
    "   2. Abre PR en repo privado denlabs-docs con actualizaciones",
    "reset",
  );
  log("   3. Actualiza STATUS.md, CHANGELOG.md en denlabs-docs", "reset");
  log("   4. Adjunta link a PR de docs en tu PR de código", "reset");
  log(
    "   5. Cuando docs estén sincronizados: corre doc:snapshot en denlabs-docs",
    "reset",
  );

  log(
    "\n💡 TIP: La documentación completa vive en el repo privado denlabs-docs\n",
    "blue",
  );
}

main();
