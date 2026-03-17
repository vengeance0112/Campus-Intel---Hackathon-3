import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  accent?: "blue" | "cyan" | "green" | "purple" | "yellow";
  suffix?: string;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== "number") return;
    const duration = 1500;
    const steps = 50;
    const step = value / steps;
    const interval = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setDisplay(Math.round(current));
      if (current >= value) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [value]);

  if (typeof value !== "number") return <span>{value}</span>;
  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

const accentMap = {
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    glow: "hover:shadow-blue-500/20",
    border: "hover:border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    trend: "text-emerald-400",
  },
  cyan: {
    icon: "bg-cyan-500/15 text-cyan-400",
    glow: "hover:shadow-cyan-500/20",
    border: "hover:border-cyan-500/30",
    badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    trend: "text-emerald-400",
  },
  green: {
    icon: "bg-blue-600/20 text-blue-300",
    glow: "hover:shadow-blue-600/20",
    border: "hover:border-blue-600/30",
    badge: "bg-blue-600/10 text-blue-300 border border-blue-600/20",
    trend: "text-emerald-400",
  },
  purple: {
    icon: "bg-indigo-500/15 text-indigo-400",
    glow: "hover:shadow-indigo-500/20",
    border: "hover:border-indigo-500/30",
    badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    trend: "text-emerald-400",
  },
  yellow: {
    icon: "bg-yellow-500/15 text-yellow-400",
    glow: "hover:shadow-yellow-500/20",
    border: "hover:border-yellow-500/30",
    badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    trend: "text-emerald-400",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
  accent = "blue",
  suffix,
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "glass-card rounded-2xl p-5 card-hover cursor-default relative overflow-hidden group",
        `hover:shadow-xl ${colors.glow} ${colors.border}`,
        className
      )}
    >
      {/* Background gradient blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, var(--glow-blue) 0%, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {trendValue && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend === "up" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                trend === "down" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-slate-500/10 text-slate-400"
            )}>
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold text-white font-display">
            {typeof value === "number"
              ? <AnimatedCounter value={value} suffix={suffix} />
              : <span>{value}</span>
            }
          </div>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
