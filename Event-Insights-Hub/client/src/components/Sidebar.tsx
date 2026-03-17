import { useLocation, Link } from "wouter";
import { useSystemHealth, useModels } from "@/hooks/use-campus-intel";
import {
  LayoutDashboard, BrainCircuit, BarChart2, Database, Sparkles,
  Menu, X, Activity, GitBranch, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

const NAV = [
  { path: "/",         label: "Dashboard",      sub: "Overview & KPIs",  icon: LayoutDashboard },
  { path: "/predictor",label: "Predictor",       sub: "Attendance Forecast", icon: BrainCircuit    },
  { path: "/analytics",label: "Analytics",       sub: "Deep Analysis",    icon: BarChart2       },
  { path: "/models",   label: "Model Registry",  sub: "ML Lifecycle",     icon: Database        },
  { path: "/insights", label: "Insights",        sub: "Auto Insights",    icon: Sparkles        },
  { path: "/pipeline", label: "System Flow",     sub: "How it Works",    icon: GitBranch       },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: health } = useSystemHealth();
  const { data: modelsData } = useModels();
  const { collapsed, toggle } = useSidebar();

  const r2 = health?.activeModelR2 ?? 0;
  const r2Pct = Math.round(r2 * 1000) / 10;

  return (
    <>
      {/* ── COLLAPSED ICON RAIL ── */}
      <AnimatePresence initial={false}>
        {collapsed && (
          <motion.aside
            key="rail"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 56, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="hidden md:flex fixed left-0 top-0 h-full flex-col z-40 border-r border-white/5 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
          >
            {/* Expand button */}
            <button
              onClick={toggle}
              title="Expand sidebar"
              className="flex items-center justify-center h-14 w-14 text-slate-400 hover:text-white transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            {/* Nav icons only */}
            <nav className="flex-1 flex flex-col items-center gap-1 py-2">
              {NAV.map(({ path, icon: Icon }) => {
                const active = location === path || (path !== "/" && location.startsWith(path));
                return (
                  <Link key={path} href={path}>
                    <div
                      title={NAV.find(n => n.path === path)?.label}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                        active ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-blue-400" : "text-slate-500")} />
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── FULL SIDEBAR ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.aside
            key="full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="hidden md:flex fixed left-0 top-0 h-full flex-col z-40 border-r border-white/5 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
          >
            {/* Logo + collapse button */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-600/25">
                  <BrainCircuit className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold font-display text-white tracking-tight">CampusIntel</p>
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">ML SYSTEM</p>
                </div>
              </div>
              <button
                onClick={toggle}
                title="Collapse sidebar"
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">NAVIGATION</p>
              {NAV.map(({ path, label, sub, icon: Icon }) => {
                const active = location === path || (path !== "/" && location.startsWith(path));
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                      active
                        ? "bg-blue-600/15 border border-blue-500/25"
                        : "hover:bg-white/4 border border-transparent hover:border-white/5"
                    )}>
                      {active && (
                        <motion.div layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-500/5 border border-blue-500/25"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                      )}
                      <div className={cn(
                        "relative z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                        active ? "bg-blue-500/25" : "bg-white/4 group-hover:bg-white/8"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-400")} />
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>{label}</p>
                        <p className="text-[10px] text-slate-600 group-hover:text-slate-500 truncate">{sub}</p>
                      </div>
                      {active && <div className="relative z-10 h-2 w-2 rounded-full bg-blue-400 status-pulse" />}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Active Model Card */}
            <div className="p-3 border-t border-white/5">
              <div className="glass rounded-xl p-3 border border-blue-500/15 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ACTIVE MODEL</span>
                  {r2 > 0 && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 status-pulse" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-display">
                    {health?.activeModel ?? "…"} v{health?.activeModelVersion ?? "…"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {modelsData?.best_model?.model ? `Best: ${modelsData.best_model.model} v${modelsData.best_model.version}` : "Loading…"}
                  </p>
                </div>
                {r2 > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">R² Score</span>
                      <span className="text-[10px] font-bold font-mono text-cyan-400">{r2.toFixed(4)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${r2 * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }} />
                    </div>
                    <p className="text-[10px] text-yellow-400/80 font-semibold">★ Best performing model</p>
                  </>
                )}
                <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>DB: event_attendance</span>
                  <span>{(health?.datasetSize ?? 0).toLocaleString()} rows</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setOpen(true)}
          className="glass border border-white/10 p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)} />
            <motion.nav
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-slate-950 border-r border-white/5 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-bold text-white">CampusIntel</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 p-3 space-y-0.5">
                {NAV.map(({ path, label, icon: Icon }) => {
                  const active = location === path || (path !== "/" && location.startsWith(path));
                  return (
                    <Link key={path} href={path}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
                        active ? "bg-blue-600/15 border border-blue-500/25 text-white" : "text-slate-400 hover:text-white hover:bg-white/4"
                      )} onClick={() => setOpen(false)}>
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-semibold">{label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <div className={cn(
                  "flex-1 flex flex-col items-center py-3 gap-0.5 cursor-pointer transition-all min-w-0",
                  active ? "text-blue-400" : "text-slate-600"
                )}>
                  <Icon className="h-4 w-4" />
                  <span className="text-[8px] font-medium truncate">{label.split(" ")[0]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
