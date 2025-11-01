"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function MiniChat() {
  const t = useTranslations("MiniChat");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    // TODO: integrate Farcaster cast/share
    setMessage("");
  };

  return (
    <div className="space-y-3 text-wolf-foreground">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">{t("title")}</p>
        <span className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
          {t("label")}
        </span>
      </div>
      <p className="text-xs text-wolf-text-subtle">{t("description")}</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          placeholder={t("placeholder")}
          className="w-full rounded-xl border border-wolf-border bg-wolf-charcoal-60 px-3 py-2 text-sm text-wolf-foreground placeholder:text-wolf-text-subtle focus:border-wolf-border-xstrong focus:outline-none"
        />
        <button
          type="submit"
          className="den-button-primary w-full text-sm font-medium"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}

export default MiniChat;
