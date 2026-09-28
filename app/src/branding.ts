export const REGISTRY_MARK_VIEWBOX = "188 246 887 738";
export const REGISTRY_MARK_PATH = "M279 246H929C1011 246 1068 318 1068 414C1068 515 1011 574 929 574H860C841 574 825 558 825 537V472C825 458 813 447 799 447H454C439 447 428 458 428 473V775C428 791 439 803 455 803H798C814 803 825 791 825 775V695C825 675 841 660 861 660H931C1017 660 1075 719 1075 819C1075 919 1016 984 929 984H279C224 984 188 948 188 893V337C188 280 224 246 279 246Z";

export function faviconAssets(staging: boolean): Record<string, string> {
  const svg = (color: string, system = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${REGISTRY_MARK_VIEWBOX}"><style>:root{color:${color}}${system ? "@media(prefers-color-scheme:dark){:root{color:#f4f4f5}}" : ""}</style><path fill="currentColor" d="${REGISTRY_MARK_PATH}"/></svg>`;
  return staging ? { "favicon-staging.svg": svg("#d13636") } : {
    "favicon.svg": svg("#18181b", true),
    "favicon-light.svg": svg("#18181b"),
    "favicon-dark.svg": svg("#f4f4f5"),
  };
}
