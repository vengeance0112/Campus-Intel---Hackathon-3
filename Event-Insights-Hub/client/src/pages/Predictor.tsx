import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { usePredictAttendance, useModels } from "@/hooks/use-campus-intel";
import { useQueryClient } from "@tanstack/react-query";
import { api, type PredictionRequest } from "@shared/routes";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Gauge, RefreshCcw,
  ArrowRight, BrainCircuit, Zap, Target, Activity, ChevronRight, ChevronDown,
  ExternalLink, Award, Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  domain: z.string().min(1),
  eventType: z.string().min(1),
  speakerType: z.string().min(1),
  durationHours: z.coerce.number().min(0.5).max(5.0),
  dayType: z.string().min(1),
  timeSlot: z.string().min(1),
  promotionDays: z.coerce.number().min(0).max(30),
  certificateFlag: z.boolean().default(false),
  interactivityLevel: z.coerce.number().min(0).max(1),
  frictions: z.object({
    promotion: z.number().min(1).max(5),
    fatigue: z.number().min(1).max(5),
    format: z.number().min(1).max(5),
    social: z.number().min(1).max(5),
    schedule: z.number().min(1).max(5),
    relevance: z.number().min(1).max(5),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const FRICTION_INFO: Record<string, string> = {
  promotion: "Pre-event awareness & marketing reach",
  fatigue: "Student academic workload & burnout",
  format: "Event structure & delivery style",
  social: "Peer participation & social influence",
  schedule: "Timing conflicts with other activities",
  relevance: "Content alignment to career goals",
};

const FRICTION_COLORS: Record<string, string> = {
  promotion: "#22D3EE",
  fatigue: "#EF4444",
  format: "#A78BFA",
  social: "#F472B6",
  schedule: "#F59E0B",
  relevance: "#4ADE80",
};

export default function Predictor() {
  const [prediction, setPrediction] = useState<any>(null);
  const { mutate: predict, isPending } = usePredictAttendance();
  const queryClient = useQueryClient();
  const { data: modelsData } = useModels();

  // ── Model/Version selector state ────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<number>(0);

  const registry = modelsData?.models ?? {};
  const modelNames = Object.keys(registry);
  const bestModel = modelsData?.best_model;

  // Resolve effective model/version (fall back to best)
  const effectiveModel = selectedModel || bestModel?.model || "";
  const modelVersions: any[] = registry[effectiveModel]?.versions ?? [];
  const effectiveVersion = selectedVersion || (modelVersions.length > 0
    ? modelVersions[modelVersions.length - 1].version : bestModel?.version ?? 0);
  const selectedVData = modelVersions.find(v => v.version === effectiveVersion)
    ?? modelVersions[modelVersions.length - 1];
  const isUsingBest = effectiveModel === bestModel?.model && effectiveVersion === bestModel?.version;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "Tech",
      eventType: "Workshop",
      speakerType: "Industry",
      durationHours: 2,
      dayType: "Weekday",
      timeSlot: "Afternoon",
      promotionDays: 7,
      certificateFlag: true,
      interactivityLevel: 0.5,
      frictions: {
        promotion: 1,
        fatigue: 1,
        format: 1,
        social: 1,
        schedule: 1,
        relevance: 1,
      },
    },
  });

  function onSubmit(values: FormValues) {
    // Include selected model+version so backend uses the right model
    const payload = {
      ...values,
      ...(effectiveModel ? { model: effectiveModel } : {}),
      ...(effectiveVersion ? { version: effectiveVersion } : {}),
    };
    predict(payload as any, {
      onSuccess: (data) => {
        setPrediction({ ...data, usedModel: effectiveModel, usedVersion: effectiveVersion });
        const currentStats = queryClient.getQueryData<any>(["/api/stats/overview"]);
        if (currentStats) {
          queryClient.setQueryData(["/api/stats/overview"], {
            ...currentStats,
            totalEvents: currentStats.totalEvents + 1,
          });
        }
      },
    });
  }

  const attendancePercent = prediction
    ? Math.min(100, (prediction.predictedAttendance / 200) * 100)
    : 0;

  const categoryColor = prediction?.category === "High"
    ? { text: "text-emerald-400", bg: "bg-emerald-400/10 border border-emerald-400/20" }
    : prediction?.category === "Medium"
      ? { text: "text-yellow-400", bg: "bg-yellow-400/10 border border-yellow-400/20" }
      : { text: "text-red-400", bg: "bg-red-400/10 border border-red-400/20" };

  return (
    <div className="min-h-screen bg-background text-foreground flex grid-bg">
      <Sidebar />
      <MainContent>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-white">
                  Attendance <span className="text-gradient-blue">Predictor</span>
                </h1>
                <p className="text-xs text-slate-500">Configure event parameters & forecast attendance with ML models</p>
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── LEFT: Input Form ── */}
            <div className="lg:col-span-7 space-y-4">

              {/* ━━ MODEL SELECTOR PANEL ━━ */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card rounded-2xl p-5 border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Database className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Model Selection</h3>
                  <span className="text-[10px] text-slate-500 ml-1">- optional, defaults to best</span>
                  {isUsingBest && (
                    <span className="ml-auto text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Auto-selected Best
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Model dropdown */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Model</label>
                    <div className="relative">
                      <select
                        value={effectiveModel}
                        onChange={e => { setSelectedModel(e.target.value); setSelectedVersion(0); }}
                        className="w-full glass border border-violet-500/25 text-violet-300 text-xs rounded-lg px-3 py-2
                                   bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none
                                   focus:border-violet-400/50 hover:border-violet-400/40 transition-colors"
                      >
                        {modelNames.length === 0 && (
                          <option value="" className="bg-slate-900">{bestModel?.model ?? 'Loading…'}</option>
                        )}
                        {modelNames.map(m => (
                          <option key={m} value={m} className="bg-slate-900 text-white">
                            {m}{m === bestModel?.model ? " ★ Best" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Version dropdown */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Version</label>
                    <div className="relative">
                      <select
                        value={effectiveVersion}
                        onChange={e => setSelectedVersion(Number(e.target.value))}
                        className="w-full glass border border-cyan-500/25 text-cyan-300 text-xs rounded-lg px-3 py-2
                                   bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none
                                   focus:border-cyan-400/50 hover:border-cyan-400/40 transition-colors"
                      >
                        {modelVersions.length === 0 && (
                          <option value={bestModel?.version ?? 0} className="bg-slate-900">v{bestModel?.version ?? 1} (best)</option>
                        )}
                        {modelVersions.map(v => (
                          <option key={v.version} value={v.version} className="bg-slate-900 text-white">
                            v{v.version} - R² {(v.r2 * 100).toFixed(2)}%{v.version === bestModel?.version && effectiveModel === bestModel?.model ? " ★" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Selected model metrics */}
                {selectedVData && (
                  <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 mb-4">
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase">Model</p>
                      <p className="text-xs font-bold text-white font-mono">{effectiveModel}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase">Version</p>
                      <p className="text-xs font-bold text-cyan-400 font-mono">v{effectiveVersion}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase">R² Score</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">{(selectedVData.r2 * 100).toFixed(4)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase">RMSE</p>
                      <p className="text-xs font-bold text-slate-300 font-mono">{selectedVData.rmse?.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase">Status</p>
                      <p className={`text-xs font-bold font-mono ${isUsingBest ? 'text-yellow-400' : effectiveVersion === Math.max(...modelVersions.map(v => v.version)) ? 'text-yellow-300' : 'text-slate-500'
                        }`}>{isUsingBest ? '★ Production' : 'Staging'}</p>
                    </div>
                    {/* R² bar */}
                    <div className="flex-1 min-w-[100px]">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${(selectedVData.r2 ?? 0) * 100}%` }}
                          transition={{ duration: 1 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Link to Models page */}
                <Link href="/models">
                  <a className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400
                                hover:text-blue-300 transition-colors group">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View All Model Versions - {modelNames.length > 0 ? `${modelNames.length * 3} total versions · ${modelNames.length} models` : '30 total versions · 10 models'}
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </Link>
              </motion.div>
              {/* ━━ END MODEL SELECTOR ━━ */}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {/* Event Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5 border border-white/5"
                  >
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      Event Parameters
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="domain" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-400">Domain</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10">
                              {["Tech", "Business", "Design", "Music", "Law"].map(v => (
                                <SelectItem key={v} value={v} className="text-slate-300 hover:text-white">{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="eventType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-400">Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10">
                              <SelectItem value="Workshop" className="text-slate-300">Workshop</SelectItem>
                              <SelectItem value="Guest_Lecture" className="text-slate-300">Guest Lecture</SelectItem>
                              <SelectItem value="Career_Talk" className="text-slate-300">Career Talk</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="speakerType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-400">Speaker Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10">
                              {["Industry", "Faculty", "Alumni"].map(v => (
                                <SelectItem key={v} value={v} className="text-slate-300">{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="dayType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-400">Day Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10">
                              <SelectItem value="Weekday" className="text-slate-300">Weekday</SelectItem>
                              <SelectItem value="Weekend" className="text-slate-300">Weekend</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="timeSlot" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-400">Time Slot</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-900 border-white/10">
                              {["Morning", "Afternoon", "Evening"].map(v => (
                                <SelectItem key={v} value={v} className="text-slate-300">{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      {/* Certificate toggle */}
                      <FormField control={form.control} name="certificateFlag" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between glass rounded-xl border border-white/5 p-3">
                          <div>
                            <FormLabel className="text-sm font-medium text-white">Certificate</FormLabel>
                            <FormDescription className="text-[10px] text-slate-500">Offer completion certificate</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </motion.div>

                  {/* Sliders */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-5 border border-white/5"
                  >
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      Engagement Factors
                    </h3>

                    <div className="space-y-5">
                      <FormField control={form.control} name="interactivityLevel" render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-sm text-slate-300">Interactivity Level</FormLabel>
                            <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                              {field.value.toFixed(2)}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0} max={1} step={0.05}
                              defaultValue={[field.value]}
                              onValueChange={(v) => field.onChange(v[0])}
                              className="[&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500 [&_.relative]:bg-white/10"
                            />
                          </FormControl>
                          <p className="text-[10px] text-slate-600 mt-1">Higher = more polls, Q&A, hands-on activities</p>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="promotionDays" render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-sm text-slate-300">Promotion Period</FormLabel>
                            <span className="text-xs font-bold font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                              {field.value} days
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0} max={30} step={1}
                              defaultValue={[field.value]}
                              onValueChange={(v) => field.onChange(v[0])}
                            />
                          </FormControl>
                          <p className="text-[10px] text-slate-600 mt-1">Recommended: 7–14 days for optimal reach</p>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="durationHours" render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-sm text-slate-300">Duration</FormLabel>
                            <span className="text-xs font-bold font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">
                              {field.value}h
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0.5} max={5} step={0.5}
                              defaultValue={[field.value]}
                              onValueChange={(v) => field.onChange(v[0])}
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </motion.div>

                  {/* Friction Sliders */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-5 border border-white/5"
                  >
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Engagement Frictions
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Rate each friction type: 1 (Low/Good) → 5 (High/Bad)</p>

                    <div className="grid grid-cols-2 gap-4">
                      {(["promotion", "fatigue", "format", "social", "schedule", "relevance"] as const).map((friction) => (
                        <FormField
                          key={friction}
                          control={form.control}
                          name={`frictions.${friction}`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-1.5">
                                <FormLabel className="capitalize text-xs text-slate-400">{friction}</FormLabel>
                                <span className="text-xs font-bold font-mono" style={{ color: FRICTION_COLORS[friction] }}>
                                  {field.value}/5
                                </span>
                              </div>
                              <FormControl>
                                <Slider
                                  min={1} max={5} step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(v) => field.onChange(v[0])}
                                  className="[&_.relative]:bg-white/10"
                                />
                              </FormControl>
                              <p className="text-[9px] text-slate-600 mt-0.5 leading-tight">{FRICTION_INFO[friction]}</p>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </motion.div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all hover:-translate-y-0.5 border-0"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Predict Attendance
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                </form>
              </Form>
            </div>

            {/* ── RIGHT: Prediction Result ── */}
            <div className="lg:col-span-5 space-y-4">
              <AnimatePresence mode="wait">
                {prediction ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    {/* Main Result */}
                    <div className="glass-card rounded-2xl p-6 border border-blue-500/25 bg-gradient-to-br from-blue-600/15 to-cyan-500/5 relative overflow-hidden">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Predicted Attendance</span>
                          </div>
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", categoryColor.bg, categoryColor.text)}>
                            {prediction.category}
                          </span>
                        </div>

                        {/* Giant number */}
                        <div className="text-center py-4">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <span className="text-7xl font-bold font-display text-white tracking-tighter">
                              {prediction.predictedAttendance}
                            </span>
                          </motion.div>
                          <p className="text-slate-400 text-sm mt-1">Expected Attendees</p>
                        </div>

                        {/* Confidence interval bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Lower Bound: {prediction.confidenceInterval[0]}</span>
                            <span>Upper Bound: {prediction.confidenceInterval[1]}</span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${attendancePercent}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </div>
                          <p className="text-[10px] text-center text-slate-500">
                            Confidence: ±15 attendees
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Why this prediction? */}
                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                      <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        Why This Prediction?
                      </h4>
                      <div className="space-y-2">
                        {prediction.contributingFactors?.map((f: any, i: number) => {
                          const isPos = f.impact === "Positive";
                          const width = Math.min(100, Math.abs(f.weight) * 2.5);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-20 shrink-0">{f.factor}</span>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${isPos ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400"}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${width}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                />
                              </div>
                              <span className={`text-xs font-bold font-mono w-12 text-right ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                                {isPos ? "+" : "-"}{Math.abs(f.weight).toFixed(0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations */}
                    {prediction.recommendations?.length > 0 && (
                      <div className="glass-card rounded-2xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {prediction.recommendations.map((rec: string, i: number) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="flex gap-2.5 text-xs items-start group"
                            >
                              <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                                <CheckCircle2 className="h-2.5 w-2.5 text-blue-400" />
                              </div>
                              <span className="text-slate-400 leading-relaxed">{rec}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-card rounded-2xl p-7 border border-white/5 flex flex-col items-center justify-center text-center min-h-[400px] space-y-5"
                  >
                    {/* Icon */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center border border-blue-500/20 animate-float">
                        <BrainCircuit className="h-10 w-10 text-blue-400/60" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white font-display mb-1">Ready to Predict</h3>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                        Fill in the form on the left, then hit <span className="text-blue-400 font-semibold">Predict Attendance</span> - the system does the rest.
                      </p>
                    </div>

                    {/* Friendly steps */}
                    <div className="w-full max-w-xs space-y-2 text-left">
                      {[
                        {
                          icon: "⚫",
                          label: "Pick a model",
                          desc: "Choose which trained model makes the forecast - or leave it, we auto-pick the best one",
                          color: "border-violet-500/30 bg-violet-500/8",
                        },
                        {
                          icon: "⚫",
                          label: "Describe your event",
                          desc: "What subject area, what type (workshop, talk…), and who is speaking?",
                          color: "border-blue-500/30 bg-blue-500/8",
                        },
                        {
                          icon: "⚫",
                          label: "When & how long?",
                          desc: "Pick the day type, time slot, and duration of the event",
                          color: "border-cyan-500/30 bg-cyan-500/8",
                        },
                        {
                          icon: "⚫",
                          label: "Promotion & extras",
                          desc: "How many days in advance did you promote it? Will you offer a certificate?",
                          color: "border-emerald-500/30 bg-emerald-500/8",
                        },
                        {
                          icon: "⚫",
                          label: "Click Predict!",
                          desc: "Get an instant attendance estimate with clear reasons behind it",
                          color: "border-orange-500/30 bg-orange-500/8",
                        },
                      ].map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.09 }}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border ${s.color}`}
                        >
                          <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{s.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </MainContent>
      <MobileNav />
    </div>
  );
}
