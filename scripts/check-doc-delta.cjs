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

// Read last snapshot from CHANGELOG.md (now in denlabs-docs repo)
function getLastSnapshot() {
  // Try to read from denlabs-docs repo if it exists in parent directory
  const docsRepoPath = path.join(process.cwd(), "../denlabs-docs/docs/CHANGELOG.md");
  const changelogPath = fs.existsSync(docsRepoPath)
    ? docsRepoPath
    : path.join(process.cwd(), "docs/CHANGELOG.md");

  if (!fs.existsSync(changelogPath)) {
    log("❌ CHANGELOG.md no encontrado en denlabs-docs ni en docs/", "red");
    log("   Asegúrate de que el repo denlabs-docs esté clonado en ../denlabs-docs", "yellow");
    process.exit(1);
  }

  const changelog = fs.readFileSync(changelogPath, "utf-8");
  const snapshotMatch = changelog.match(/## Snapshot: ([a-f0-9]{7})/);

  if (!snapshotMatch) {
    log("❌ No se encontró snapshot en CHANGELOG.md", "red");
    log("   Formato esperado: ## Snapshot: <hash> (<date>)", "yellow");
    process.exit(1);
  }

  return snapshotMatch[1];
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
function generateDeltaReport(snapshot, head, analysis) {
  const date = new Date().toISOString().split("T")[0];

  let report = `# Documentation Delta Report

**Generated:** ${date}
**Snapshot:** ${snapshot}
**Current HEAD:** ${head}

## Summary

`;

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

  const lastSnapshot = getLastSnapshot();
  const currentHead = getCurrentHead();

  log(`\n📸 Último snapshot: ${lastSnapshot}`, "cyan");
  log(`🎯 HEAD actual:     ${currentHead}`, "cyan");

  if (lastSnapshot === currentHead) {
    log("\n✅ No hay delta. Docs sincronizados con HEAD.", "green");
    log("\n💡 Este es el estado documentado en docs/CHANGELOG.md", "blue");
    process.exit(0);
  }

  const diffStat = checkDelta(lastSnapshot, currentHead);

  if (!diffStat) {
    log("\n✅ No hay delta. Docs sincronizados.", "green");
    process.exit(0);
  }

  log("\n⚠️  DELTA DETECTADO:", "yellow");
  log("━".repeat(60), "yellow");
  console.log(diffStat);

  const changedFiles = getChangedFiles(lastSnapshot, currentHead);
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
    log("   → STATUS.md en repo privado denlabs-docs debe actualizarse", "yellow");
  }

  // Generate DOC_DELTA_REPORT.md
  const reportPath = path.join(process.cwd(), "docs/DOC_DELTA_REPORT.md");
  const report = generateDeltaReport(lastSnapshot, currentHead, analysis);
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
  log("   1. Revisa docs/DOC_DELTA_REPORT.md para detalles", "reset");
  log("   2. Abre PR en repo privado denlabs-docs con actualizaciones", "reset");
  log("   3. Actualiza STATUS.md, CHANGELOG.md en denlabs-docs", "reset");
  log("   4. Adjunta link a PR de docs en tu PR de código", "reset");
  log("   5. Cuando docs estén sincronizados: corre doc:snapshot en denlabs-docs", "reset");

  log("\n💡 TIP: La documentación completa vive en el repo privado denlabs-docs\n", "blue");
}

main();
