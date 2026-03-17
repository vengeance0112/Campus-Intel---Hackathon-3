import { useState } from "react";
import { useModels } from "@/hooks/use-campus-intel";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from "recharts";
import {
  BrainCircuit, Award, TrendingUp, ChevronDown, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Professional monochromatic palette
const COLORS = ["#3B82F6", "#60A5FA", "#1D4ED8", "#2563EB", "#93C5FD", "#1E40AF", "#BFDBFE", "#172554", "#1e3a8a", "#2563EB"];

// ── Transparent-cursor custom tooltip ──────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-blue-500/20 shadow-xl text-xs"
      style={{ background: "rgba(15,23,42,0.92)", backdropFilter: "blur(12px)" }}>
      <p className="text-blue-300 font-semibold mb-1">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color || "#fff" }} className="font-bold">
          {e.name}: {typeof e.value === "number" ? (e.value < 2 ? (e.value * 100).toFixed(4) + "%" : e.value.toFixed(4)) : e.value}
        </p>
      ))}
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    Production: "bg-emerald-400/10 border-emerald-400/30 text-emerald-400",
    Staging:    "bg-yellow-400/10 border-yellow-400/30 text-yellow-400",
    Archived:   "bg-slate-500/10 border-slate-500/30 text-slate-500",
  }[status] ?? "bg-slate-500/10 border-slate-500/30 text-slate-500";
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {status}
    </span>
  );
}

// ── Per-model row with inline version dropdown ──────────────────────────────
function ModelRow({ name, versions, best, colorIndex }: { name: string; versions: any[]; best: any; colorIndex: number }) {
  const maxVer = Math.max(...versions.map((v: any) => v.version));
  // Default selected version = best version (highest R²) if this is the best model, else latest
  const defaultV = name === best?.model
    ? (best?.version ?? maxVer)
    : maxVer;
  const [selVer, setSelVer] = useState<number>(defaultV);

  const v = versions.find(vv => vv.version === selVer) ?? versions[versions.length - 1];
  const isBestRow = name === best?.model && selVer === best?.version;
  const status = isBestRow ? "Production" : selVer === maxVer ? "Staging" : "Archived";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: colorIndex * 0.04 }}
      className={cn("border-b border-white/5 hover:bg-white/3 transition-colors",
        isBestRow && "bg-yellow-500/5")}
    >
      {/* Model name */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[colorIndex % COLORS.length] }} />
          <span className="font-semibold text-white text-sm">{name}</span>
          {isBestRow && <span className="text-yellow-400 text-xs">🏆</span>}
        </div>
      </td>

      {/* Version dropdown */}
      <td className="p-4">
        <div className="relative inline-block">
          <select
            value={selVer}
            onChange={e => setSelVer(Number(e.target.value))}
            className="glass border border-blue-500/25 text-blue-300 text-xs rounded-lg px-3 py-1.5
                       bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none
                       focus:border-blue-400/50 hover:border-blue-400/40 transition-colors"
          >
            {versions.map((vv: any) => (
              <option key={vv.version} value={vv.version} className="bg-slate-900 text-white">
                v{vv.version}{vv.version === best?.version && name === best?.model ? " ★" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400 pointer-events-none" />
        </div>
      </td>

      {/* R² Score */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${v.r2 * 100}%`, background: COLORS[colorIndex % COLORS.length] }} />
          </div>
          <span className="font-mono font-bold text-cyan-400 text-xs">{(v.r2 * 100).toFixed(4)}%</span>
        </div>
      </td>

      {/* RMSE */}
      <td className="p-4 font-mono text-slate-400 text-xs">{v.rmse.toFixed(4)}</td>

      {/* MAE */}
      <td className="p-4 font-mono text-slate-400 text-xs">{(v.mae ?? 0).toFixed(4)}</td>

      {/* Status */}
      <td className="p-4"><StatusBadge status={status} /></td>
    </motion.tr>
  );
}

export default function Models() {
  const { data: modelsData, isLoading } = useModels();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"r2" | "rmse" | "name">("r2");

  const registry = modelsData?.models ?? {};
  const modelNames = Object.keys(registry);
  const best = modelsData?.best_model;
  const latestPerModel: any[] = modelsData?.latestPerModel ?? [];
  const versionTimeline: Record<string, any[]> = modelsData?.versionTimeline ?? {};

  const activeModel = selectedModel ?? modelNames[0] ?? "";
  const activeTimeline = versionTimeline[activeModel] ?? [];
  const trend = modelsData?.modelTrends?.[activeModel];

  // Sort model names for the table
  const sortedModelNames = [...modelNames].sort((a, b) => {
    const la = (registry[a] as any)?.versions ?? [];
    const lb = (registry[b] as any)?.versions ?? [];
    if (sortBy === "r2") {
      const ra = Math.max(...la.map((v: any) => v.r2));
      const rb = Math.max(...lb.map((v: any) => v.r2));
      return rb - ra;
    }
    if (sortBy === "rmse") {
      const ra = Math.min(...la.map((v: any) => v.rmse));
      const rb = Math.min(...lb.map((v: any) => v.rmse));
      return ra - rb;
    }
    return a.localeCompare(b);
  });

  // Build sorted latest-per-model for comparison chart
  const chartModels = [...latestPerModel].sort((a: any, b: any) => b.r2 - a.r2);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <BrainCircuit className="h-10 w-10 text-blue-400 mx-auto mb-3 animate-spin" style={{ animationDuration: "3s" }} />
          <p className="text-white font-bold">Loading model registry…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex grid-bg">
      <Sidebar />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">
                Model <span className="text-gradient-blue">Registry</span>
              </h1>
              <p className="text-xs text-slate-500">
                {modelNames.length} models · {latestPerModel.length * 3} versions · source: artifacts/model_registry.json
              </p>
            </div>
          </motion.div>

          {/* Best Model Hero */}
          {best && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-5 border border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 to-transparent"
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/30 to-amber-400/10 border border-yellow-500/30 flex items-center justify-center">
                    <Award className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-yellow-500/70 font-semibold uppercase tracking-wider">🏆 Best Performing Model</p>
                    <p className="text-xl font-bold font-display text-white">{best.model} v{best.version}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">R² Score</p>
                    <p className="text-2xl font-bold font-mono text-yellow-400">{(best.r2 * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">RMSE</p>
                    <p className="text-lg font-bold font-mono text-cyan-400">{(best.rmse ?? 0).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Why Best?</p>
                    <p className="text-sm text-slate-300">Highest R² across all {modelNames.length} models</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Status</p>
                    <StatusBadge status="Production" />
                  </div>
                </div>
                <div className="ml-auto hidden md:block">
                  <p className="text-[10px] text-slate-500 mb-1.5">Accuracy Gauge</p>
                  <div className="w-48 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${best.r2 * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{(best.r2 * 100).toFixed(2)}% explained variance</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* R² Bar - FIXED: real colors + transparent cursor */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/5">
              <div className="mb-4">
                <h3 className="font-display font-bold text-white">R² Score Comparison</h3>
                <p className="text-xs text-slate-500">Latest version per model - real values from registry JSON</p>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartModels} barSize={22}>
                    <defs>
                      {chartModels.map((m: any, i: number) => (
                        <linearGradient key={i} id={`r2bar${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.model === best?.model ? "#22D3EE" : COLORS[i % COLORS.length]} stopOpacity={1} />
                          <stop offset="100%" stopColor={m.model === best?.model ? "#22D3EE" : COLORS[i % COLORS.length]} stopOpacity={0.3} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="model" axisLine={false} tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 9 }} dy={8} />
                    <YAxis domain={[0, 1]} axisLine={false} tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 10 }}
                      tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                    {/* cursor fill transparent removes white rectangle on hover */}
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="r2" name="R² Score" radius={[4, 4, 0, 0]}>
                      {chartModels.map((m: any, i: number) => (
                        <Cell key={i} fill={`url(#r2bar${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="mb-3">
                <h3 className="font-display font-bold text-white">R² Radar</h3>
                <p className="text-xs text-slate-500">Top models visual comparison</p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartModels.slice(0, 6).map((m: any) => ({ model: m.model.slice(0, 5), r2: m.r2 }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="model" tick={{ fill: "#64748B", fontSize: 9 }} />
                    <Radar name="R²" dataKey="r2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.18} strokeWidth={1.5} />
                    <Tooltip content={<Tip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Version Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card rounded-2xl p-5 border border-white/5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-white">Version Timeline</h3>
                <p className="text-xs text-slate-500">Click a model to view R² and RMSE progression across versions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelNames.map(m => (
                  <button key={m} onClick={() => setSelectedModel(m)}
                    className={cn("text-xs px-3 py-1.5 rounded-lg border transition-all font-medium",
                      activeModel === m
                        ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                        : "border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                    )}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTimeline.length > 0 ? (
                <motion.div key={activeModel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {/* R² line */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">R² Score across versions</p>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeTimeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }}
                            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                          <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeDasharray: "4 4" }} />
                          <Line type="monotone" dataKey="r2" name="R²" stroke="#22D3EE"
                            strokeWidth={2.5} dot={{ fill: "#22D3EE", r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* RMSE line */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">RMSE across versions (lower = better)</p>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeTimeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                          <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeDasharray: "4 4" }} />
                          <Line type="monotone" dataKey="rmse" name="RMSE" stroke="#64748B"
                            strokeWidth={2.5} dot={{ fill: "#64748B", r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {trend && (
                    <div className="md:col-span-2 p-3 rounded-xl border border-blue-500/15 bg-blue-500/5 flex items-start gap-3">
                      {trend.improving
                        ? <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        : <Activity className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />}
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-white">{activeModel}</span>{" "}
                        {trend.improving
                          ? <span className="text-emerald-400">improved by {(trend.r2Delta * 100).toFixed(4)}% (+{trend.pctChange}%)</span>
                          : <span className="text-yellow-400">stable metrics</span>
                        }{" "}
                        across <span className="font-mono text-blue-400">{trend.versions}</span> versions.{" "}
                        Best: <span className="font-mono text-yellow-400">v{trend.bestVersion}</span> ·{" "}
                        Latest: <span className="font-mono text-cyan-400">v{trend.latestVersion}</span>.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Select a model above</p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── All Model Versions Table (per-model rows with version dropdown) ── */}
          <motion.div id="all-versions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-white/5">
              <div>
                <h3 className="font-display font-bold text-white">All Model Versions</h3>
                <p className="text-xs text-slate-500">
                  {modelNames.length} models · Use the dropdown to compare any version's metrics · auto-updates after retraining
                </p>
              </div>
              {/* Sort control */}
              <div className="relative">
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className="glass border border-white/10 text-slate-400 text-xs rounded-lg px-3 py-1.5 bg-transparent appearance-none pr-6 cursor-pointer focus:outline-none"
                >
                  <option value="r2" className="bg-slate-900">Sort: Best R² first</option>
                  <option value="rmse" className="bg-slate-900">Sort: Best RMSE first</option>
                  <option value="name" className="bg-slate-900">Sort: A → Z</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    {["Model", "Version", "R² Score", "RMSE", "MAE", "Status"].map(h => (
                      <th key={h} className="text-left p-4 text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedModelNames.map((name, i) => {
                    const versions: any[] = (registry[name] as any)?.versions ?? [];
                    return (
                      <ModelRow key={name} name={name} versions={versions} best={best} colorIndex={i} />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[11px] text-slate-600">
                ↑ Select any version from the dropdown to compare its exact R², RMSE and MAE · Rows auto-refresh after model retraining
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400">Production</span>
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 ml-2" />
                <span className="text-[10px] text-yellow-400">Staging</span>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500 ml-2" />
                <span className="text-[10px] text-slate-500">Archived</span>
              </div>
            </div>
          </motion.div>

        </div>
      </MainContent>
      <MobileNav />
    </div>
  );
}
