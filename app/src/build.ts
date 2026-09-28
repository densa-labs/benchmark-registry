declare const __REGISTRY_STAGING__: boolean;
declare const __REGISTRY_BUILD_TIMESTAMP__: string;
declare const __REGISTRY_BUILD_ID__: string;

export const IS_STAGING = typeof __REGISTRY_STAGING__ !== "undefined" && __REGISTRY_STAGING__;
export const BUILD_TIMESTAMP = typeof __REGISTRY_BUILD_TIMESTAMP__ === "undefined"
  ? "Local development" : __REGISTRY_BUILD_TIMESTAMP__;
export const BUILD_ID = typeof __REGISTRY_BUILD_ID__ === "undefined" ? "local" : __REGISTRY_BUILD_ID__;
export const REGISTRY_DATA_DATE = "September 26, 2026";
