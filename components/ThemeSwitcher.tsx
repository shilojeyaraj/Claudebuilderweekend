"use client";

import { useTheme } from "@/components/ThemeProvider";
import { UI_THEMES, type UIThemeId } from "@/lib/ui-themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="ui-theme-switcher flex flex-col gap-2 min-w-0 shrink"
      role="group"
      aria-label="Choose a visual theme"
    >
      <span className="ui-theme-switcher-label text-[0.65rem] font-semibold uppercase tracking-[0.12em] opacity-80 whitespace-nowrap">
        Look &amp; feel
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin [scrollbar-width:thin] items-stretch max-w-[min(100%,520px)] sm:max-w-none">
        {UI_THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id as UIThemeId)}
              title={t.tagline}
              className={[
                "ui-theme-chip shrink-0 rounded-full px-3 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]",
                active
                  ? "ui-theme-chip-active shadow-md scale-[1.02]"
                  : "ui-theme-chip-idle opacity-90 hover:opacity-100 hover:scale-[1.01]",
              ].join(" ")}
            >
              <span className="block text-xs font-semibold leading-tight whitespace-nowrap">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
