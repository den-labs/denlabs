"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { getModuleConfig, getBreadcrumbKeys, getTitleKey } from "@/config/moduleKeys";

export function TopBar() {
  const t = useTranslations();
  const pathname = usePathname();

  const config = getModuleConfig(pathname || '');
  const titleKey = getTitleKey(pathname || '');
  const breadcrumbKeys = getBreadcrumbKeys(pathname || '');

  const title = titleKey ? t(titleKey) : t("TopBar.fallback.title");
  const description = titleKey
    ? t(`${titleKey.replace('sidebar', 'TopBar.modules')}.description`, {
        default: "",
      })
    : t("TopBar.fallback.description");

  // Generate breadcrumb text
  const breadcrumb = breadcrumbKeys
    .map((key) => t(key, { default: "" }))
    .filter(Boolean)
    .join(" > ");

  return (
    <div className="flex w-full flex-col gap-4 text-wolf-foreground">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-wolf-border bg-wolf-charcoal-60 text-xs text-wolf-foreground transition hover:border-wolf-border-xstrong"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
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
    </div>
  );
}

export default TopBar;
