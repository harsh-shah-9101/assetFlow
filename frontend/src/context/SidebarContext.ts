// src/context/SidebarContext.ts
import { createContext, useContext } from "react";

export interface SidebarCtx { open: boolean; setOpen: (v: boolean) => void; }
export const SidebarContext = createContext<SidebarCtx>({ open: false, setOpen: () => {} });
export const useSidebar = () => useContext(SidebarContext);
