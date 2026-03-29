export const UI_THEME_STORAGE_KEY = "pw-ui-theme";

export const UI_THEMES = [
  {
    id: "maple-paper",
    label: "Maple Paper",
    tagline: "Warm editorial · calm reading room",
  },
  {
    id: "aurora-night",
    label: "Aurora Night",
    tagline: "Northern lights · cosy after dark",
  },
  {
    id: "civic-playday",
    label: "Civic Playday",
    tagline: "Round & friendly · neighbourhood corkboard",
  },
  {
    id: "heritage-brass",
    label: "Heritage Brass",
    tagline: "Library lamp · refined & grounded",
  },
  {
    id: "prairie-dawn",
    label: "Prairie Dawn",
    tagline: "Soft nature · hopeful morning light",
  },
] as const;

export type UIThemeId = (typeof UI_THEMES)[number]["id"];

export const DEFAULT_UI_THEME: UIThemeId = "maple-paper";

export function isUIThemeId(value: string | null): value is UIThemeId {
  return UI_THEMES.some((t) => t.id === value);
}
