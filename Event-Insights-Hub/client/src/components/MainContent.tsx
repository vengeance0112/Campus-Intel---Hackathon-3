import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { ReactNode } from "react";

/**
 * Drop this around every page's <main> to get auto-adjusting left margin
 * that responds to the sidebar collapsed state.
 *
 * Usage:
 *   <MainContent>
 *     <div className="max-w-7xl mx-auto ...">...</div>
 *   </MainContent>
 */
export function MainContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  return (
    <motion.main
      animate={{ marginLeft: collapsed ? 56 : 256 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className={`flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto h-screen scrollbar-hide ${className}`}
    >
      {children}
    </motion.main>
  );
}
