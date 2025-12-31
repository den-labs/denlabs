"use client";

import { useTranslations } from "next-intl";
import {
  getBreadcrumbKeys,
  getModuleConfig,
  getTitleKey,
} from "@/config/moduleKeys";
import { usePathname } from "@/i18n/routing";

export function TopBar() {
  const t = useTranslations();
  const pathname = usePathname();

  const config = getModuleConfig(pathname || "");
  const titleKey = getTitleKey(pathname || "");
  const breadcrumbKeys = getBreadcrumbKeys(pathname || "");

  const title = titleKey ? t(titleKey) : t("TopBar.fallback.title");

  // Extract module name from titleKey (sidebar.section.module -> module)
  const moduleName = config?.module;
  const description = moduleName
    ? t(`TopBar.modules.${moduleName}.description`, { default: "" })
    : t("TopBar.fallback.description");

  // Generate breadcrumb text
  const breadcrumb = breadcrumbKeys
    .map((key) => t(key, { default: "" }))
    .filter(Boolean)
    .join(" > ");

  return (
    <div className="flex w-full flex-col gap-4 text-wolf-foreground">
      <div className="text-left">
        {breadcrumb && (
          <div className="text-xs text-wolf-text-subtle mb-0.5">
            {breadcrumb}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-wolf-text-subtle">{description}</p>
        )}
      </div>
    </div>
  );
}

export default TopBar;
