import { useState } from "react";
import {
  useStatsOverview, useStatsCharts, useSystemHealth,
  useModels, useDataEvolution, useDataSummary,
} from "@/hooks/use-campus-intel";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { StatCard } from "@/components/StatCard";
import {
  Users, Calendar, Database, Target, BrainCircuit,
  Activity, Zap, BarChart2, Award, RefreshCcw, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Professional monochromatic - blue/slate, cyan accent only
const COLORS = ["#3B82F6", "#60A5FA", "#1D4ED8", "#2563EB", "#93C5FD", "#1E40AF"];
// Donut / pie shades
const PIE_COLORS = ["#3B82F6", "#22D3EE", "#64748B"];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-blue-500/20 shadow-xl text-sm">
      <p className="text-blue-300 font-semibold mb-1 text-xs">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color || "#fff" }} className="font-bold">
          {e.name}: {typeof e.value === "number" ? e.value.toLocaleString() : e.value}
        </p>
      ))}
    </div>
  );
};

function ModelSelector({
  models,
  selectedModel,
  selectedVersion,
  onModelChange,
  onVersionChange,
}: {
  models: any;
  selectedModel: string;
  selectedVersion: number;
  onModelChange: (m: string) => void;
  onVersionChange: (v: number) => void;
}) {
  const modelNames = models ? Object.keys(models) : [];
  const versions: any[] = models?.[selectedModel]?.versions ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Viewing:</span>
      {/* Model picker */}
      <div className="relative">
        <select
          value={selectedModel}
          onChange={e => {
            onModelChange(e.target.value);
            const newVersions = models?.[e.target.value]?.versions ?? [];
            if (newVersions.length) onVersionChange(newVersions[newVersions.length - 1].version);
          }}
          className="glass border border-blue-500/25 text-blue-300 text-xs rounded-lg px-3 py-1.5
                     bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none
                     focus:border-blue-400/50 hover:border-blue-400/40 transition-colors"
        >
          {modelNames.map(m => (
            <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400 pointer-events-none" />
      </div>
      {/* Version picker */}
      <div className="relative">
        <select
          value={selectedVersion}
          onChange={e => onVersionChange(Number(e.target.value))}
          className="glass border border-cyan-500/25 text-cyan-300 text-xs rounded-lg px-3 py-1.5
                     bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none
                     focus:border-cyan-400/50 hover:border-cyan-400/40 transition-colors"
        >
          {versions.map(v => (
            <option key={v.version} value={v.version} className="bg-slate-900 text-white">
              v{v.version} - R²: {(v.r2 * 100).toFixed(2)}%
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-cyan-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Loading skeleton card
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/5 mb-3" />
      <div className="h-3 w-20 bg-white/5 rounded mb-2" />
      <div className="h-8 w-24 bg-white/8 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const { data: overview, isLoading: ovLoading } = useStatsOverview();
  const { data: charts, isLoading: chartsLoading } = useStatsCharts();
  const { data: health } = useSystemHealth();
  const { data: modelsData } = useModels();
  const { data: evolution } = useDataEvolution();
  const { data: summary } = useDataSummary();

  // Model selector state - default to best model
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<number>(0);

  // Resolve selected model (default = best)
  const registry = modelsData?.models;
  const effectiveModel = selectedModel || modelsData?.best_model?.model || "";
  const effectiveVersions: any[] = registry?.[effectiveModel]?.versions ?? [];
  const effectiveVersion = selectedVersion || (effectiveVersions.length > 0
    ? effectiveVersions[effectiveVersions.length - 1].version : 0);
  const selectedVersionData = effectiveVersions.find(v => v.version === effectiveVersion)
    ?? effectiveVersions[effectiveVersions.length - 1];

  const isBest = effectiveModel === modelsData?.best_model?.model
    && effectiveVersion === modelsData?.best_model?.version;

  const r2 = selectedVersionData?.r2 ?? health?.activeModelR2 ?? 0;
  const rmse = selectedVersionData?.rmse ?? health?.activeModelRmse ?? 0;

  const isLoading = ovLoading || chartsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center animate-float">
            <BrainCircuit className="h-8 w-8 text-white" />
          </div>
          <p className="text-white font-display font-bold text-lg">CampusIntel</p>
          <p className="text-slate-500 text-sm">Loading live data from SQLite…</p>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                animate={{ opacity: [.3,1,.3], scale: [.8,1,.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex grid-bg">
      <Sidebar />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── HEADER ── */}
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
                Dashboard <span className="text-gradient-blue">Overview</span>
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm">
                Live data from <span className="text-blue-400 font-mono text-xs">event_attendance</span> ·{" "}
                <span className="text-cyan-400 font-mono text-xs">{overview?.totalEvents?.toLocaleString() ?? "…"}</span> records
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 status-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">System Live</span>
                </div>
                <div className="glass rounded-full px-3 py-1.5 border border-blue-500/20 flex items-center gap-2">
                  <RefreshCcw className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">Auto-refresh 15s</span>
                </div>
              </div>
              {/* Model Selector */}
              {registry && (
                <ModelSelector
                  models={registry}
                  selectedModel={effectiveModel}
                  selectedVersion={effectiveVersion}
                  onModelChange={m => { setSelectedModel(m); setSelectedVersion(0); }}
                  onVersionChange={setSelectedVersion}
                />
              )}
            </div>
          </motion.header>

          {/* ── SELECTED MODEL STATUS ── */}
          {selectedVersionData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn(
                "glass-card rounded-xl p-4 border flex flex-wrap items-center gap-4",
                isBest ? "border-cyan-500/25 bg-cyan-500/5" : "border-white/5"
              )}
            >
              {isBest && <span className="text-cyan-400 text-sm">★</span>}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Active Selection</p>
                <p className="text-white font-bold font-display">{effectiveModel} v{effectiveVersion}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "R² Score", val: `${(r2 * 100).toFixed(4)}%`, color: "text-cyan-400" },
                  { label: "RMSE", val: rmse.toFixed(4), color: "text-blue-400" },
                  { label: "Status", val: isBest ? "Production" : effectiveVersion === Math.max(...effectiveVersions.map(v => v.version)) ? "Staging" : "Archived",
                    color: isBest ? "text-emerald-400" : "text-yellow-400" },
                  { label: "Version", val: `v${effectiveVersion} of ${effectiveVersions.length}`, color: "text-blue-400" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                    <p className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
              {/* Accuracy bar */}
              <div className="ml-auto hidden md:block">
                <p className="text-[10px] text-slate-500 mb-1">R² Accuracy</p>
                <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${r2 * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{(r2 * 100).toFixed(1)}% variance explained</p>
              </div>
            </motion.div>
          )}

          {/* ── KPI CARDS ── */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {isLoading ? [0,1,2,3].map(i => <SkeletonCard key={i} />) : (
              <>
                <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                  <StatCard title="Total Events" value={overview?.totalEvents ?? 0}
                    icon={Calendar} description="Real records in DB" trend="up" trendValue="+live" accent="blue" />
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                  <StatCard title="Avg Attendance" value={overview?.avgAttendance ?? 0}
                    icon={Users} description={`Top: ${overview?.topDomain ?? "…"}`} trend="up" trendValue="real" accent="cyan" />
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                  <StatCard title="Model R² Score" value={Math.round(r2 * 1000) / 10}
                    suffix="%" icon={Target}
                    description={`${effectiveModel} v${effectiveVersion}`}
                    trend={isBest ? "up" : "neutral"} trendValue={isBest ? "Best" : "Staging"} accent="cyan" />
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                  <StatCard title="Dataset Size" value={health?.datasetSize ?? overview?.totalEvents ?? 0}
                    icon={Database}
                    description={`${health?.totalVersions ?? 0} versions · ${health?.totalModels ?? 0} models`}
                    trend="up" trendValue="live" accent="blue" />
                </motion.div>
              </>
            )}
          </motion.div>

          {/* ── SYSTEM HEALTH BAR ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-4 border border-white/5"
          >
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live System State</span>
              </div>
              <div className="flex flex-wrap gap-5">
                {[
                  { label: "DB Table", val: "event_attendance", color: "text-slate-300" },
                  { label: "Records", val: (health?.datasetSize ?? 0).toLocaleString(), color: "text-cyan-400" },
                  { label: "Best Model", val: `${health?.activeModel ?? "…"} v${health?.activeModelVersion ?? "…"}`, color: "text-cyan-400" },
                  { label: "Best R²", val: `${((health?.activeModelR2 ?? 0)*100).toFixed(2)}%`, color: "text-blue-400" },
                  { label: "Models", val: health?.totalModels ?? 0, color: "text-slate-300" },
                  { label: "Versions", val: health?.totalVersions ?? 0, color: "text-slate-300" },
                  { label: "Registry", val: "artifacts/model_registry.json", color: "text-slate-400" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xs font-bold font-mono ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── VERSION COMPARISON (selected model) ── */}
          {effectiveVersions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="glass-card rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-white">{effectiveModel} - Version History</h3>
                  <p className="text-xs text-slate-500">R² and RMSE progression across model versions</p>
                </div>
                <div className="text-xs text-slate-500">{effectiveVersions.length} versions trained</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Version bars */}
                <div className="space-y-3">
                  {effectiveVersions.map((v: any) => {
                    const isActive = v.version === effectiveVersion;
                    const isBestV = v.r2 === Math.max(...effectiveVersions.map((x: any) => x.r2));
                    return (
                      <button key={v.version}
                        onClick={() => setSelectedVersion(v.version)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          isActive ? "border-blue-500/40 bg-blue-500/10" : "border-white/5 hover:border-white/10 hover:bg-white/3"
                        )}
                      >
                        <span className={cn("text-xs font-mono font-bold w-6", isActive ? "text-blue-400" : "text-slate-500")}>v{v.version}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className={cn("h-full rounded-full", isBestV ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-blue-500/50 to-blue-600/50")}
                              initial={{ width: 0 }} animate={{ width: `${v.r2 * 100}%` }}
                              transition={{ duration: 1, delay: v.version * 0.1 }} />
                          </div>
                        </div>
                        <span className={cn("text-xs font-mono font-bold w-14 text-right", isBestV ? "text-cyan-400" : "text-slate-400")}>
                          {(v.r2 * 100).toFixed(2)}%
                        </span>
                        {isBestV && <span className="text-[10px] text-cyan-400">★</span>}
                        {isActive && <span className="text-[10px] text-blue-400">●</span>}
                      </button>
                    );
                  })}
                </div>
                {/* Version metrics table */}
                <div className="glass rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left p-3 text-slate-500 font-semibold uppercase tracking-wider">Version</th>
                        <th className="text-right p-3 text-slate-500 font-semibold uppercase tracking-wider">R²</th>
                        <th className="text-right p-3 text-slate-500 font-semibold uppercase tracking-wider">RMSE</th>
                        <th className="text-right p-3 text-slate-500 font-semibold uppercase tracking-wider">MAE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectiveVersions.map((v: any, i: number) => {
                        const prev = effectiveVersions[i - 1];
                        const r2Δ = prev ? v.r2 - prev.r2 : 0;
                        return (
                          <tr key={v.version} className={cn("border-b border-white/5", v.version === effectiveVersion && "bg-blue-500/8")}>
                            <td className="p-3 font-mono text-slate-400">v{v.version}</td>
                            <td className="p-3 text-right font-mono font-bold text-cyan-400">{(v.r2 * 100).toFixed(4)}%</td>
                            <td className="p-3 text-right font-mono text-slate-400">{v.rmse.toFixed(4)}</td>
                            <td className="p-3 text-right font-mono text-slate-400">{(v.mae ?? 0).toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Trend note */}
              {modelsData?.modelTrends?.[effectiveModel] && (
                <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <p className="text-xs text-blue-300">
                    <span className="font-semibold">📈 Lifecycle:</span>{" "}
                    {modelsData.modelTrends[effectiveModel].improving
                      ? `Improving over versions - R² gained ${(modelsData.modelTrends[effectiveModel].r2Delta * 100).toFixed(4)}% (+${modelsData.modelTrends[effectiveModel].pctChange}%)`
                      : `Stable across ${modelsData.modelTrends[effectiveModel].versions} versions`
                    }. Best version: v{modelsData.modelTrends[effectiveModel].bestVersion}.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── CHARTS ROW ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {/* Attendance by Domain */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-white">Attendance by Domain</h3>
                  <p className="text-xs text-slate-500">Real avg from event_attendance</p>
                </div>
                <BarChart2 className="h-4 w-4 text-blue-400" />
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.attendanceByDomain ?? []} barSize={36}>
                    <defs>
                      {COLORS.map((c, i) => (
                        <linearGradient key={i} id={`dombg${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="value" name="Avg Attendance" radius={[6,6,0,0]} cursor="pointer">
                      {(charts?.attendanceByDomain ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={`url(#dombg${i % COLORS.length})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Speaker Impact Donut */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="mb-4">
                <h3 className="font-display font-bold text-white">Speaker Impact</h3>
                <p className="text-xs text-slate-500">Avg attendance by speaker type</p>
              </div>
              <div className="h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts?.attendanceBySpeaker ?? []}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={4} dataKey="value">
                      {(charts?.attendanceBySpeaker ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center -mt-4">
                    <span className="block text-xl font-bold text-white">{charts?.attendanceBySpeaker?.length ?? 0}</span>
                    <span className="text-[10px] text-slate-500">Types</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {(charts?.attendanceBySpeaker ?? []).map((e: any, i: number) => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-400">{e.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── DATA EVOLUTION + MODEL COMPARISON ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Dataset Growth */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-white">Data Evolution</h3>
                  <p className="text-xs text-slate-500">Cumulative dataset growth - {(evolution?.totalSize ?? 0).toLocaleString()} total records</p>
                </div>
                <div className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1 border border-emerald-500/20">
                  <Zap className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">{evolution?.dataGrowthPercent ?? 0}% growth</span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolution?.datasetGrowth ?? []}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="size" name="Records" stroke="#22D3EE" strokeWidth={2.5} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Domain mini-breakdown */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(evolution?.domainBreakdown ?? []).map((d: any, i: number) => (
                  <div key={d.name} className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1 border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6" }} />
                    <span className="text-[10px] text-slate-400">{d.name}: <span className="text-white font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model R² Comparison (all latest versions) */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-white">Model Comparison</h3>
                  <p className="text-xs text-slate-500">Latest R² per model - real values from registry</p>
                </div>
                <Award className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...(modelsData?.latestPerModel ?? [])].sort((a: any, b: any) => b.r2 - a.r2)}
                    layout="vertical" barSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v: number) => `${(v*100).toFixed(0)}%`} />
                    <YAxis dataKey="model" type="category" width={90} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 9 }} />
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="r2" name="R² Score" radius={[0,3,3,0]}>
                      {[...(modelsData?.latestPerModel ?? [])].sort((a: any, b: any) => b.r2 - a.r2).map((m: any, i: number) => (
                        <Cell key={i}
                          fill={m.model === modelsData?.best_model?.model ? "#22D3EE" : "#3B82F6"}
                          opacity={m.model === modelsData?.best_model?.model ? 1 : 0.45 + i * 0.04}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                <p className="text-xs text-yellow-300">
                  <span className="font-semibold">🏆 Best:</span>{" "}
                  {modelsData?.best_model?.model} v{modelsData?.best_model?.version} with R²={((modelsData?.best_model?.r2 ?? 0)*100).toFixed(4)}%
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── FRICTION + INTERACTIVITY ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Friction bars (real SQL) */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="mb-4">
                <h3 className="font-display font-bold text-white">Friction Impact</h3>
                <p className="text-xs text-slate-500">Attendance drop % when friction is high (real queries)</p>
              </div>
              <div className="space-y-3">
                {(charts?.frictionImpact ?? []).map((f: any, i: number) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0">{f.name}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #3B82F6, #22D3EE)` }}
                        initial={{ width: 0 }} animate={{ width: `${f.value}%` }}
                        transition={{ duration: 1.2, delay: i*0.08 }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-white w-8 text-right">{f.value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                <p className="text-xs text-red-300">
                  ⚠️ Computed from real data: attendance drop when friction score ≥4 vs ≤2 per type.
                </p>
              </div>
            </div>

            {/* Engagement breakdown */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="mb-4">
                <h3 className="font-display font-bold text-white">Engagement Distribution</h3>
                <p className="text-xs text-slate-500">Real Engagement_Level breakdown from DB</p>
              </div>
              <div className="space-y-3">
                {(summary?.engagementDistribution ?? evolution?.engagementBreakdown?.map((e: any) => ({ level: e.name, count: e.value })) ?? [])
                  .map((e: any, i: number) => {
                    const total = (summary?.totalEvents ?? overview?.totalEvents ?? 1);
                    const pct = Math.round((e.count / total) * 100);
                    return (
                      <div key={e.level || e.name} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-16 shrink-0">{e.level ?? e.name}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, #3B82F6, #1D4ED8)` }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: i*0.1 }} />
                        </div>
                        <span className="text-xs font-mono text-slate-400">{(e.count ?? e.value).toLocaleString()}</span>
                        <span className="text-xs font-bold text-white w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(summary?.domainDistribution ?? []).slice(0,3).map((d: any, i: number) => (
                  <div key={d.domain} className="glass rounded-lg p-2 border border-white/5 text-center">
                    <p className="text-[10px] text-slate-500">{d.domain}</p>
                    <p className="text-sm font-bold text-white font-mono">{d.count}</p>
                    <p className="text-[9px] text-slate-600">events</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </MainContent>
      <MobileNav />
    </div>
  );
}
