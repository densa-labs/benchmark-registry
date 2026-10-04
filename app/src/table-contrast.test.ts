import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const tokens = (block: string) => Object.fromEntries([...block.matchAll(/(--[a-z-]+):\s*(#[a-f0-9]{6})/gu)].map(match => [match[1], match[2]]));
const light = tokens(css.match(/:root\s*\{([^}]+)\}/u)![1]);
const dark = { ...light, ...tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/u)![1]) };
function luminance(hex: string) {
  const values = hex.slice(1).match(/../gu)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

it.each([light, dark])("meets AA for shared small text on table surfaces", palette => {
  for (const foreground of ["--text", "--text-muted", "--accent", "--accent-strong"]) {
    for (const background of ["--background", "--surface", "--surface-strong", "--accent-soft"]) {
      expect(contrast(palette[foreground], palette[background]), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(contrast(palette["--focus"], palette["--surface-strong"])).toBeGreaterThanOrEqual(3);
});
