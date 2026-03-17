import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import {
  Database, BrainCircuit, GitBranch, Trophy, LayoutDashboard,
  MousePointer2, Cpu, RefreshCcw, Lightbulb, X, Github,
  Play, Pause, SkipForward, Zap, ChevronRight, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── NODE DEFINITIONS ────────────────────────────────────────────────────────
const NODES = [
  {
    id: "data-gen",
    title: "Data Generation",
    subtitle: "Raw Data Creation",
    icon: Layers,
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.35)",
    description: "System creates a rich dataset of 10,000+ campus events - capturing domain, speaker type, interactivity, promotional details, and attendance numbers.",
    tech: ["Python Script", "10,003 Records", "CSV Format"],
    step: "Generating synthetic event dataset…",
  },
  {
    id: "storage",
    title: "Data Storage",
    subtitle: "SQLite Database",
    icon: Database,
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.35)",
    description: "All events are stored in a lightweight SQLite database - fast, portable, and always available. Real SQL queries power every chart on the dashboard.",
    tech: ["SQLite", "event_attendance table", "~10K rows"],
    step: "Loading records into database…",
  },
  {
    id: "training",
    title: "Model Training Engine",
    subtitle: "Learning from Data",
    icon: BrainCircuit,
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.35)",
    description: "The system trains multiple ML models at once - teaching each one to recognise patterns that predict how many students will attend an event.",
    tech: ["Linear Regression", "Ridge", "Lasso", "XGBoost", "Random Forest"],
    step: "Training 10 models in parallel…",
  },
  {
    id: "versioning",
    title: "Model Versioning",
    subtitle: "Track Every Improvement",
    icon: GitBranch,
    color: "#F472B6",
    glow: "rgba(244,114,182,0.35)",
    description: "Every time a model is retrained, a new version is saved with its accuracy score (R²) and error rate (RMSE). Nothing is ever lost.",
    tech: ["v1 → v2 → v3", "R² & RMSE tracked", "Per-model history"],
    step: "Saving model versions to registry…",
  },
  {
    id: "registry",
    title: "Model Registry",
    subtitle: "Best Model Selection",
    icon: Trophy,
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.35)",
    description: "The system automatically compares all versions across all models and crowns the best performer. No manual tuning needed.",
    tech: ["model_registry.json", "Auto best-pick", "30 versions · 10 models"],
    step: "Selecting best performing model…",
  },
  {
    id: "dashboard",
    title: "Dashboard System",
    subtitle: "Live Intelligence Hub",
    icon: LayoutDashboard,
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.35)",
    description: "Real-time metrics, charts, and model comparisons are served directly from live SQL queries - so the dashboard always reflects reality.",
    tech: ["React + Recharts", "Real SQL queries", "Auto-refresh 15s"],
    step: "Rendering live dashboard metrics…",
  },
  {
    id: "user",
    title: "User Interaction",
    subtitle: "You're in Control",
    icon: MousePointer2,
    color: "#4ADE80",
    glow: "rgba(74,222,128,0.35)",
    description: "You pick the model, set the event parameters (domain, speaker, venue, interactivity), and the system does the rest.",
    tech: ["Model selector", "12 event parameters", "Version picker"],
    step: "User configuring event parameters…",
  },
  {
    id: "prediction",
    title: "Prediction Engine",
    subtitle: "Instant ML Forecast",
    icon: Cpu,
    color: "#FB923C",
    glow: "rgba(251,146,60,0.35)",
    description: "Your chosen model analyses the event parameters and generates a predicted attendance number in milliseconds - powered by real ML inference.",
    tech: ["Ridge / XGBoost / etc.", "< 50ms response", "Explainable output"],
    step: "Generating attendance prediction…",
  },
  {
    id: "feedback",
    title: "Feedback Loop",
    subtitle: "System Gets Smarter",
    icon: RefreshCcw,
    color: "#F472B6",
    glow: "rgba(244,114,182,0.35)",
    description: "New event data flows back in, triggering automatic retraining. The system continuously improves - old versions are kept for comparison.",
    tech: ["Auto-retrain trigger", "CSV import pipeline", "Version increment"],
    step: "Retraining with new event data…",
  },
  {
    id: "insights",
    title: "Insight Engine",
    subtitle: "Patterns & Recommendations",
    icon: Lightbulb,
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.35)",
    description: "The system surfaces hidden patterns - which friction factors hurt attendance, which domains thrive, which speaker types draw crowds - in plain English.",
    tech: ["Correlation engine", "Auto-insights", "Natural language output"],
    step: "Generating intelligent insights…",
  },
];

// ─── SPEED MAP ────────────────────────────────────────────────────────────────
const SPEED_MAP = { slow: 2800, normal: 1600, fast: 800 };

// ─── PARTICLE floats between node centres ─────────────────────────────────────
function FlowParticle({ progress, color }: { progress: number; color: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        width: 12, height: 12,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 18px 6px ${color}88, 0 0 6px 2px ${color}`,
        top: -6, left: -6,
        opacity: progress > 0 && progress < 1 ? 1 : 0,
      }}
    />
  );
}

// ─── SINGLE NODE CARD ─────────────────────────────────────────────────────────
function NodeCard({
  node, active, visited, index, onClick,
}: {
  node: typeof NODES[0]; active: boolean; visited: boolean; index: number; onClick: () => void;
}) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: "easeOut" }}
      onClick={onClick}
      className="relative cursor-pointer select-none"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* glow ring when active */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.08 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 32px 8px ${node.glow}`, border: `1.5px solid ${node.color}55` }}
          />
        )}
      </AnimatePresence>

      {/* ripple burst */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="ripple"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${node.color}`, borderRadius: 16 }}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "relative glass-card rounded-2xl p-4 border transition-all duration-300",
        active
          ? "border-opacity-60 bg-white/5"
          : visited
            ? "border-white/8 bg-white/2"
            : "border-white/5 bg-transparent",
      )}
        style={{ borderColor: active ? node.color + "88" : undefined }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${node.color}30, ${node.color}10)`,
                border: `1px solid ${node.color}40`,
              }}
            >
              <Icon className="h-4.5 w-4.5" style={{ color: node.color }} />
            </div>
            {visited && !active && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border border-slate-950 flex items-center justify-center">
                <span style={{ fontSize: 7, color: "#fff" }}>✓</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{node.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{node.subtitle}</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── CONNECTOR between nodes ──────────────────────────────────────────────────
function Connector({ active, color, particleProgress }: { active: boolean; color: string; particleProgress: number }) {
  const id = `conn-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="relative flex flex-col items-center" style={{ height: 40 }}>
      {/* static line */}
      <svg width="4" height="40" className="overflow-visible">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={active ? 0.7 : 0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={active ? 0.4 : 0.08} />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0" width="3" height="40" rx="1.5" fill={`url(#${id})`} />
        {/* travelling dot */}
        {active && particleProgress > 0 && particleProgress < 1 && (
          <circle
            cx="2"
            cy={particleProgress * 40}
            r="5"
            fill={color}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>
    </div>
  );
}

// ─── DETAIL PANEL ──────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose }: { node: typeof NODES[0]; onClose: () => void }) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 w-80 z-50 glass-card rounded-2xl border border-white/10 p-5 shadow-2xl"
      style={{ boxShadow: `0 0 60px ${node.glow}` }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${node.color}35, ${node.color}10)`, border: `1px solid ${node.color}50` }}
        >
          <Icon className="h-6 w-6" style={{ color: node.color }} />
        </div>
        <div>
          <p className="font-bold text-white text-base">{node.title}</p>
          <p className="text-xs text-slate-500">{node.subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">{node.description}</p>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Details</p>
        {node.tech.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: node.color }} />
            <span className="text-xs text-slate-400 font-mono">{t}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── BACKGROUND DOTS ──────────────────────────────────────────────────────────
function BackgroundDots() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-400/10"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.05, 0.25, 0.05], y: [0, -20, 0] }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Pipeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedSet, setVisitedSet] = useState<Set<number>>(new Set([0]));
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<keyof typeof SPEED_MAP>("normal");
  const [mode, setMode] = useState<"auto" | "step">("auto");
  const [connProgress, setConnProgress] = useState(0); // 0-1 within connector
  const [selectedNode, setSelectedNode] = useState<typeof NODES[0] | null>(null);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set((e.clientX / window.innerWidth - 0.5) * 18);
    mouseY.set((e.clientY / window.innerHeight - 0.5) * 12);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Auto flow ticker
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setConnProgress(0);
    setActiveIndex((prev) => {
      const next = (prev + 1) % NODES.length;
      setVisitedSet((v) => new Set(Array.from(v).concat(next)));
      return next;
    });
  }, []);

  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (!isPlaying || mode !== "auto") return;

    const ms = SPEED_MAP[speed];
    const tick = 30;
    const steps = ms / tick;
    let step = 0;

    progressRef.current = setInterval(() => {
      step++;
      setConnProgress(Math.min(step / steps, 1));
      if (step >= steps) {
        clearInterval(progressRef.current!);
      }
    }, tick);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, ms);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, speed, mode, advance, activeIndex]);

  const handleStep = () => {
    if (mode === "step") advance();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex grid-bg relative overflow-x-hidden">
      <BackgroundDots />
      <Sidebar />

      <MainContent className="relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ x: springX, y: springY }}
            className="text-center pt-4 pb-2"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 border border-blue-500/20 mb-4">
              <Zap className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-semibold tracking-wide">LIVE SYSTEM VISUALIZATION</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white leading-tight">
              How <span className="text-gradient-blue">CampusIntel</span> Works
            </h1>
            <p className="text-slate-400 mt-3 text-base leading-relaxed max-w-xl mx-auto">
              From raw data to intelligent predictions - watch the system breathe
            </p>
          </motion.div>

          {/* ── CONTROLS ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                isPlaying
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30",
              )}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause" : "Play"}
            </button>

            {/* Step control */}
            <div className="flex items-center glass rounded-xl border border-white/8 overflow-hidden">
              {(["auto", "step"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3 py-2 text-xs font-bold capitalize transition-all",
                    mode === m ? "bg-violet-600/30 text-violet-300" : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Step forward button */}
            {mode === "step" && (
              <button
                onClick={handleStep}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600/30 transition-all"
              >
                <SkipForward className="h-3.5 w-3.5" /> Next Step
              </button>
            )}

            {/* Speed */}
            <div className="flex items-center glass rounded-xl border border-white/8 overflow-hidden">
              {(["slow", "normal", "fast"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "px-3 py-2 text-xs font-bold capitalize transition-all",
                    speed === s ? "bg-cyan-600/25 text-cyan-300" : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── STEP STATUS TEXT ── */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 border border-white/8">
              <motion.div
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-xs text-slate-300 font-medium">{NODES[activeIndex].step}</span>
            </div>
          </motion.div>

          {/* ── PIPELINE ── */}
          <motion.div
            style={{ x: springX, y: springY }}
            className="space-y-0"
          >
            {NODES.map((node, i) => (
              <div key={node.id}>
                <NodeCard
                  node={node}
                  active={activeIndex === i}
                  visited={visitedSet.has(i)}
                  index={i}
                  onClick={() => setSelectedNode(node)}
                />
                {i < NODES.length - 1 && (
                  <div className="flex justify-center">
                    <Connector
                      active={activeIndex === i}
                      color={node.color}
                      particleProgress={activeIndex === i ? connProgress : 0}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Feedback arrow back to top */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center justify-center gap-2 mt-2 opacity-40"
            >
              <RefreshCcw className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-widest">
                Continuous Learning Loop
              </span>
              <RefreshCcw className="h-3.5 w-3.5 text-pink-400" />
            </motion.div>
          </motion.div>

          {/* ── NODE INDEX DOTS ── */}
          <div className="flex justify-center gap-1.5 py-2">
            {NODES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIndex(i); setVisitedSet((v) => new Set(Array.from(v).concat(i))); }}
                className="transition-all"
              >
                <div className={cn(
                  "rounded-full transition-all duration-300",
                  activeIndex === i
                    ? "w-5 h-2 bg-blue-400"
                    : visitedSet.has(i)
                      ? "w-2 h-2 bg-emerald-400/60"
                      : "w-2 h-2 bg-white/10",
                )} />
              </button>
            ))}
          </div>

          {/* ── CTA BUTTON ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-3 pt-4 pb-8"
          >
            <p className="text-xs text-slate-500">Full source code, notebooks, and documentation available</p>
            <motion.a
              href="https://github.com/vengeance0112/Campus-Intel---Hackathon-3.git"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-white text-sm overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #1d2433 0%, #0f172a 100%)",
                border: "1px solid rgba(99,102,241,0.35)",
                boxShadow: "0 0 30px rgba(99,102,241,0.2), 0 0 60px rgba(34,211,238,0.08)",
              }}
            >
              {/* animated shimmer */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.1) 100%)",
                }}
              />
              <Github className="h-5 w-5 relative z-10 text-violet-400" />
              <span className="relative z-10">Explore Full Project on GitHub</span>
              <ChevronRight className="h-4 w-4 relative z-10 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.a>
          </motion.div>

        </div>
      </MainContent>

      {/* ── DETAIL PANEL ── */}
      <AnimatePresence>
        {selectedNode && (
          <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
