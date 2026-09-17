export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "benchmark-registry-theme";
export const SYSTEM_DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

interface ThemeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface ThemeRoot {
  dataset: Record<string, string | undefined>;
}

export function readStoredTheme(storage: Pick<ThemeStorage, "getItem">): Theme | null {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function resolveTheme(storedTheme: Theme | null, prefersDark: boolean): Theme {
  return storedTheme ?? (prefersDark ? "dark" : "light");
}

export function applyStoredTheme(
  root: ThemeRoot,
  storage: Pick<ThemeStorage, "getItem">,
): Theme | null {
  const theme = readStoredTheme(storage);

  if (theme) {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }

  return theme;
}

export function storeTheme(
  theme: Theme,
  root: ThemeRoot,
  storage: Pick<ThemeStorage, "setItem">,
) {
  root.dataset.theme = theme;

  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The current page still honors the choice when persistent storage is unavailable.
  }
}
