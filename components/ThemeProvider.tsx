"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_UI_THEME,
  UI_THEME_STORAGE_KEY,
  type UIThemeId,
  isUIThemeId,
} from "@/lib/ui-themes";

type ThemeContextValue = {
  theme: UIThemeId;
  setTheme: (id: UIThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(id: UIThemeId) {
  document.documentElement.dataset.uiTheme = id;
  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

function readThemeFromDocument(): UIThemeId {
  if (typeof document === "undefined") return DEFAULT_UI_THEME;
  const fromDom = document.documentElement.dataset.uiTheme;
  return isUIThemeId(fromDom ?? null) ? fromDom : DEFAULT_UI_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UIThemeId>(readThemeFromDocument);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(UI_THEME_STORAGE_KEY);
      if (isUIThemeId(stored)) {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        applyTheme(DEFAULT_UI_THEME);
      }
    } catch {
      applyTheme(DEFAULT_UI_THEME);
    }
  }, []);

  const setTheme = useCallback((id: UIThemeId) => {
    setThemeState(id);
    applyTheme(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
