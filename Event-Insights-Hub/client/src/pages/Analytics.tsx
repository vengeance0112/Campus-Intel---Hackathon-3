import { useStatsCharts, useInsights, useModels, useDataSummary, useDataEvolution } from "@/hooks/use-campus-intel";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, LineChart, Line, Legend,
} from "recharts";
import { BarChart2, Activity, Zap, TrendingUp, Database, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Professional monochromatic palette - blue/slate tones only
const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#2563EB", "#BFDBFE", "#1E40AF"];
// Bar chart gradient pairs [top, bottom]
const BAR_GRADIENTS = [
  ["#3B82F6", "#1D4ED8"],
  ["#60A5FA", "#2563EB"],
  ["#93C5FD", "#3B82F6"],
  ["#2563EB", "#1E40AF"],
  ["#BFDBFE", "#60A5FA"],
];
// Line chart: blue family with enough contrast to distinguish
const LINE_COLORS = ["#60A5FA", "#22D3EE", "#818CF8", "#94A3B8"];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-blue-500/20 shadow-xl text-xs">
      <p className="text-blue-300 font-semibold mb-1">{label ?? ""}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color || "#fff" }} className="font-bold">
          {e.name}: {typeof e.value === "number" ? e.value.toFixed(typeof e.value === "number" && e.value < 2 ? 4 : 1) : e.value}
        </p>
      ))}
    </div>
  );
};

function SectionHeader({ title, subtitle, icon: Icon, color = "text-blue-400" }: any) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {Icon && <Icon className={cn("h-4 w-4", color)} />}
      <div>
        <h3 className="font-display font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: charts } = useStatsCharts();
  const { data: insightsData } = useInsights();
  const { data: modelsData } = useModels();
  const { data: summary } = useDataSummary();
  const { data: evolution } = useDataEvolution();

  const frictionImpact = charts?.frictionImpact ?? [];
  const radarData = frictionImpact.map((f: any) => ({ friction: f.name, impact: f.value }));
  const scatter = charts?.interactivityCorrelation ?? [];
  const insights = insightsData?.insights ?? [];
  const latestPerModel = modelsData?.latestPerModel ?? [];
  const versionTimeline = modelsData?.versionTimeline ?? {};

  // Build combined version timeline for top 4 models by R²
  const top4Models = [...latestPerModel].sort((a: any, b: any) => b.r2 - a.r2).slice(0, 4).map((m: any) => m.model);
  const maxVersions = Math.max(...top4Models.map(m => (versionTimeline[m] ?? []).length));
  const versionChartData = Array.from({ length: maxVersions }, (_, vi) => {
    const pt: any = { label: `v${vi + 1}` };
    top4Models.forEach(m => {
      const ver = (versionTimeline[m] ?? [])[vi];
      if (ver) pt[m] = Number((ver.r2 * 100).toFixed(4));
    });
    return pt;
  });

  const byTimeslot = (summary?.domainDistribution ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground flex grid-bg">
      <Sidebar />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">
                Advanced <span className="text-gradient-blue">Analytics</span>
              </h1>
              <p className="text-xs text-slate-500">
                Real SQL queries · {(summary?.totalEvents ?? 0).toLocaleString()} records · friction, correlation & model accuracy
              </p>
            </div>
          </motion.div>

          {/* Dataset Summary Strip */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-4 border border-white/5 flex flex-wrap gap-5"
          >
            <Database className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            {[
              { label: "Total Records", val: (summary?.totalEvents ?? 0).toLocaleString(), color: "text-cyan-400" },
              { label: "Avg Attendance", val: summary?.avgAttendance ?? 0, color: "text-white" },
              { label: "Max Attendance", val: summary?.maxAttendance ?? 0, color: "text-emerald-400" },
              { label: "Min Attendance", val: summary?.minAttendance ?? 0, color: "text-red-400" },
              { label: "Top Domain", val: summary?.domainDistribution?.[0]?.domain ?? "…", color: "text-blue-400" },
              { label: "Top Speaker", val: summary?.speakerDistribution?.sort((a: any, b: any) => b.avgAttendance - a.avgAttendance)?.[0]?.speaker ?? "…", color: "text-violet-400" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-sm font-bold font-mono", s.color)}>{s.val}</p>
              </div>
            ))}
          </motion.div>

          {/* Friction Analysis Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Friction Radar */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <SectionHeader title="Friction Analysis Radar" subtitle="Attendance drop % when each friction is high - real SQL" icon={Activity} color="text-blue-400" />
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="friction" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Radar name="Impact %" dataKey="impact" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip content={<Tip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-xs text-slate-400">
                  Higher % = larger attendance drop when that friction is high. Computed from real one-hot friction columns.
                </p>
              </div>
            </div>

            {/* Friction Ranking */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <SectionHeader title="Friction Impact Ranking" subtitle="Ordered by magnitude of attendance effect" icon={Zap} color="text-blue-400" />
              <div className="space-y-3">
                {[...frictionImpact].sort((a: any, b: any) => b.value - a.value).map((f: any, i: number) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-600 w-4 text-right font-bold">#{i+1}</span>
                    <span className="text-xs text-slate-300 w-20 shrink-0 font-medium">{f.name}</span>
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #3B82F6, #22D3EE)` }}
                        initial={{ width: 0 }} animate={{ width: `${f.value}%` }}
                        transition={{ duration: 1.2, delay: i * 0.08 }} />
                    </div>
                    <span className="text-xs font-bold font-mono text-white w-8 text-right">{f.value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-xs text-slate-400">
                  💡 {frictionImpact.length > 0
                    ? `${[...frictionImpact].sort((a: any, b: any) => b.value - a.value)[0]?.name} has the greatest negative impact on attendance.`
                    : "Loading real friction analysis…"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Interactivity ROI + Domain Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Scatter - real from DB */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <SectionHeader title="Interactivity ROI" subtitle={`${scatter.length} real data points sampled from DB`} icon={TrendingUp} color="text-cyan-400" />
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="x" name="Interactivity" type="number" domain={[0,1]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} label={{ value:"Interactivity Level", position:"insideBottom", offset:-4, fill:"#475569", fontSize:10 }} />
                    <YAxis dataKey="y" name="Attendance" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<Tip />} />
                    <Scatter data={scatter} fill="#22D3EE" opacity={0.5} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Domain Performance */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <SectionHeader title="Domain Performance" subtitle="Avg attendance from real SQL GROUP BY" icon={BarChart2} color="text-blue-400" />
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.attendanceByDomain ?? []} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="value" name="Avg Attendance" radius={[4,4,0,0]}>
                      {(charts?.attendanceByDomain ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={BAR_GRADIENTS[i % BAR_GRADIENTS.length][0]} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Model Accuracy Trends (version-wise for top 4) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 border border-white/5"
          >
            <SectionHeader title="Model Accuracy Trends" subtitle={`R² progression across versions for top ${top4Models.length} models - source: model_registry.json`} icon={Activity} color="text-emerald-400" />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={versionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748B" }} />
                  {top4Models.map((m, i) => (
                    <Line key={m} type="monotone" dataKey={m} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Speaker Type + Promotion Analysis from real insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {insights.slice(0, 3).map((ins: any, i: number) => (
              <div key={ins.id} className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{ins.category}</span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border",
                    ins.positive ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20")}>
                    {ins.positive ? "+" : ""}{ins.magnitude}%
                  </span>
                </div>
                <p className="text-sm font-bold text-white mb-2 leading-snug">{ins.title}</p>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ins.chartData ?? []} barSize={20}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 9 }} />
                      <Bar dataKey="value" name="Avg" radius={[3,3,0,0]}>
                        {(ins.chartData ?? []).map((_: any, ci: number) => (
                          <Cell key={ci} fill="#3B82F6" opacity={0.7 + ci * 0.08} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Event Type Distribution */}
          {evolution?.eventTypeBreakdown && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-5 border border-white/5"
            >
              <SectionHeader title="Event Type Distribution" subtitle="Real count per event type from DB" icon={BarChart2} color="text-violet-400" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evolution.eventTypeBreakdown.map((e: any, i: number) => {
                  const total = evolution.totalSize;
                  const pct = Math.round((e.value / total) * 100);
                  return (
                    <div key={e.name} className="glass rounded-xl border border-white/5 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-white">{e.name}</span>
                        <span className="text-xs font-mono text-slate-400">{pct}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                        <motion.div className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, #3B82F6, #1D4ED8)` }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }} />
                      </div>
                      <p className="text-xl font-bold text-white font-mono">{e.value.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">events</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      </MainContent>
      <MobileNav />
    </div>
  );
}
