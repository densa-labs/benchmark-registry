import { createContext } from "react";
import type { LoadedRegistryRoute } from "./registry";
export const BreadcrumbContext=createContext<LoadedRegistryRoute|undefined>(undefined);
