import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SidebarContext, useSidebar } from "../../context/SidebarContext";


/* ─── Sidebar (provider) ─── */
export const Sidebar = ({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (v: boolean) => void;
}) => {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen ?? setLocalOpen;
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

/* ─── SidebarBody – the animated rail ─── */
export const SidebarBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <motion.div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      animate={{ width: open ? 240 : 68 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        overflow: "hidden",
        flexShrink: 0,
        padding: "20px 12px",
        boxSizing: "border-box",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── SidebarLink ─── */
export const SidebarLink = ({
  link,
  isActive = false,
  onClick,
}: {
  link: { label: string; href: string; icon: React.ReactNode };
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const { open } = useSidebar();
  return (
    <Link
      to={link.href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px",
        borderRadius: "8px",
        textDecoration: "none",
        backgroundColor: isActive ? "#eff6ff" : "transparent",
        transition: "background-color 0.15s ease",
        whiteSpace: "nowrap",
        overflow: "hidden",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {/* Icon – always visible */}
      <div style={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {link.icon}
      </div>

      {/* Label – fade in/out with AnimatePresence */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              fontSize: "14px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#3b82f6" : "#374151",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};
