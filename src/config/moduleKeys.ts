/**
 * Module Keys - Single source of truth for navigation and breadcrumbs
 *
 * This config maps routes to their sections, modules, and i18n keys.
 * Used by TopBar, SidebarNav, and breadcrumb generation.
 */

export type Section = "laboratory" | "tools" | "library" | "account";
export type ModuleStatus = "ready" | "experimental" | "planned" | "external";

export interface ModuleConfig {
  section: Section;
  module: string;
  parent?: string;
  subpage?: string;
  onlyInIndex?: boolean;
}

/**
 * Route to module mapping
 * Key: pathname (without locale prefix)
 * Value: module configuration
 */
export const MODULE_KEYS: Record<string, ModuleConfig> = {
  // Laboratory
  "/dashboard": { section: "laboratory", module: "home" },
  "/labs": { section: "laboratory", module: "myLabs" },
  "/labs/create": {
    section: "laboratory",
    module: "myLabs",
    subpage: "create",
  },

  // Tools
  "/spray": { section: "tools", module: "spray" },
  "/gooddollar": { section: "tools", module: "gooddollar" },
  "/mentors": { section: "tools", module: "mentors" },

  // Library
  "/library": { section: "library", module: "browse" },
  "/library/trust-scoring": { section: "library", module: "trustScoring" },
  "/library/x402": { section: "library", module: "premiumAccess" },
  "/library/a2a": { section: "library", module: "agentNetwork" },
  "/library/games": {
    section: "library",
    module: "gamesLab",
    onlyInIndex: true,
  },
  "/library/quests": {
    section: "library",
    module: "questsEngine",
    onlyInIndex: true,
  },
  "/library/attendance": {
    section: "library",
    module: "attendanceTools",
    onlyInIndex: true,
  },
  "/library/voting": {
    section: "library",
    module: "votingSystem",
    onlyInIndex: true,
  },
  "/library/sponsors": {
    section: "library",
    module: "sponsorToolkit",
    onlyInIndex: true,
  },
  "/tools/eip3009": { section: "library", module: "eip3009Checker" },

  // Account
  "/verification": { section: "account", module: "verification" },
  "/settings": { section: "account", module: "settings" },
} as const;

/**
 * Module status configuration
 * Defines the state badge for each module
 */
export const MODULE_STATUS: Record<string, ModuleStatus> = {
  // Laboratory
  home: "ready",
  myLabs: "ready",

  // Tools
  spray: "ready",
  gooddollar: "ready",
  mentors: "ready",

  // Library
  browse: "ready",
  trustScoring: "experimental",
  premiumAccess: "experimental",
  agentNetwork: "planned",
  eip3009Checker: "experimental",
  gamesLab: "experimental",
  questsEngine: "planned",
  attendanceTools: "experimental",
  votingSystem: "planned",
  sponsorToolkit: "planned",

  // Account
  verification: "ready",
  settings: "ready",
} as const;

/**
 * Get module configuration for a given pathname
 */
export function getModuleConfig(pathname: string): ModuleConfig | null {
  // Try exact match first
  if (MODULE_KEYS[pathname]) {
    return MODULE_KEYS[pathname];
  }

  // Try to find by prefix (for dynamic routes like /labs/[slug])
  const matchingKey = Object.keys(MODULE_KEYS).find((key) =>
    pathname.startsWith(`${key}/`),
  );

  return matchingKey ? MODULE_KEYS[matchingKey] : null;
}

/**
 * Get breadcrumb parts for a given pathname
 * Returns array of i18n keys for breadcrumb rendering
 */
export function getBreadcrumbKeys(pathname: string): string[] {
  const config = getModuleConfig(pathname);
  if (!config) return [];

  const parts: string[] = [];

  // Add section
  parts.push(`sidebar.sections.${config.section}`);

  // Add parent if exists (e.g., "Rewards" for Spray/GoodDollar)
  if (config.parent) {
    parts.push(`sidebar.${config.section}.${config.parent}`);
  }

  // Add module
  parts.push(`sidebar.${config.section}.${config.module}`);

  return parts;
}

/**
 * Get the title i18n key for a given pathname
 */
export function getTitleKey(pathname: string): string | null {
  const config = getModuleConfig(pathname);
  if (!config) return null;

  return `sidebar.${config.section}.${config.module}`;
}

