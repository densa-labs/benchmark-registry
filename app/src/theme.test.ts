import { describe, expect, it } from "vitest";

import {
  THEME_STORAGE_KEY,
  applyStoredTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
} from "./theme";

function createStorage(value: string | null) {
  const writes: Array<[string, string]> = [];

  return {
    storage: {
      getItem: (key: string) => (key === THEME_STORAGE_KEY ? value : null),
      setItem: (key: string, nextValue: string) => {
        writes.push([key, nextValue]);
      },
    },
    writes,
  };
}

describe("theme preference", () => {
  it("accepts only explicit light and dark preferences", () => {
    expect(readStoredTheme(createStorage("light").storage)).toBe("light");
    expect(readStoredTheme(createStorage("dark").storage)).toBe("dark");
    expect(readStoredTheme(createStorage("auto").storage)).toBeNull();
    expect(readStoredTheme(createStorage(null).storage)).toBeNull();
  });

  it("uses the operating-system preference when no explicit choice exists", () => {
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("applies persisted themes and leaves the root automatic otherwise", () => {
    const explicitRoot = { dataset: {} as Record<string, string | undefined> };
    const automaticRoot = {
      dataset: { theme: "dark" } as Record<string, string | undefined>,
    };

    expect(applyStoredTheme(explicitRoot, createStorage("light").storage)).toBe("light");
    expect(explicitRoot.dataset.theme).toBe("light");

    expect(applyStoredTheme(automaticRoot, createStorage(null).storage)).toBeNull();
    expect(automaticRoot.dataset.theme).toBeUndefined();
  });

  it("persists a selected theme and updates the page root", () => {
    const root = { dataset: {} as Record<string, string | undefined> };
    const { storage, writes } = createStorage(null);

    storeTheme("dark", root, storage);

    expect(root.dataset.theme).toBe("dark");
    expect(writes).toEqual([[THEME_STORAGE_KEY, "dark"]]);
  });
});
