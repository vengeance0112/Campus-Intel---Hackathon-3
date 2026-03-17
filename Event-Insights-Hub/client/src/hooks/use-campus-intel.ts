import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PredictionRequest } from "@shared/routes";

// ============================================================
//  QUERY KEYS (centralised to avoid typos)
// ============================================================
export const QK = {
  overview:       ["/api/stats/overview"],
  charts:         ["/api/stats/charts"],
  events:         ["/api/events"],
  models:         ["/api/models"],
  registry:       ["/api/models/registry"],
  health:         ["/api/system/health"],
  evolution:      ["/api/data/evolution"],
  insights:       ["/api/insights"],
  dataSummary:    ["/api/data/summary"],
  modelPerf:      (model: string, version?: number) =>
    ["/api/model/performance", model, version ?? "latest"],
} as const;

const get = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
};

// ============================================================
//  STAT HOOKS
// ============================================================

export function useStatsOverview() {
  return useQuery({
    queryKey: QK.overview,
    queryFn: () => get(api.stats.overview.path),
    refetchInterval: 15_000,
  });
}

export function useStatsCharts() {
  return useQuery({
    queryKey: QK.charts,
    queryFn: () => get(api.stats.charts.path),
    refetchInterval: 30_000,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: QK.events,
    queryFn: () => get(api.events.list.path),
    staleTime: 60_000,
  });
}

// ============================================================
//  DATA HOOKS
// ============================================================

export function useDataSummary() {
  return useQuery({
    queryKey: QK.dataSummary,
    queryFn: () => get("/api/data/summary"),
    refetchInterval: 15_000,
  });
}

export function useDataEvolution() {
  return useQuery({
    queryKey: QK.evolution,
    queryFn: () => get("/api/data/evolution"),
    refetchInterval: 30_000,
  });
}

export function useInsights() {
  return useQuery({
    queryKey: QK.insights,
    queryFn: () => get("/api/insights"),
    staleTime: 60_000,
  });
}

// ============================================================
//  MODEL HOOKS
// ============================================================

/** All models - canonical /api/models endpoint */
export function useModels() {
  return useQuery({
    queryKey: QK.models,
    queryFn: () => get("/api/models"),
    staleTime: 10_000,
  });
}

/** Backward-compat registry hook used by Models.tsx */
export function useModelRegistry() {
  return useQuery({
    queryKey: QK.registry,
    queryFn: () => get("/api/models/registry"),
    staleTime: 10_000,
  });
}

/** Performance for a specific model + version */
export function useModelPerformance(model: string, version?: number) {
  const url = version != null
    ? `/api/model/performance?model=${encodeURIComponent(model)}&version=${version}`
    : `/api/model/performance?model=${encodeURIComponent(model)}`;
  return useQuery({
    queryKey: QK.modelPerf(model, version),
    queryFn: () => get(url),
    enabled: !!model,
    staleTime: 10_000,
  });
}

// ============================================================
//  SYSTEM HOOKS
// ============================================================

export function useSystemHealth() {
  return useQuery({
    queryKey: QK.health,
    queryFn: () => get("/api/system/health"),
    refetchInterval: 10_000,
  });
}

// ============================================================
//  PREDICTION
// ============================================================

export function usePredictAttendance() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: PredictionRequest) => {
      const validated = api.prediction.predict.input.parse(data);
      const res = await fetch(api.prediction.predict.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error(`Prediction HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all data-dependent queries so dashboard refreshes live
      qc.invalidateQueries({ queryKey: QK.overview });
      qc.invalidateQueries({ queryKey: QK.dataSummary });
      qc.invalidateQueries({ queryKey: QK.evolution });
      qc.invalidateQueries({ queryKey: QK.health });
      qc.invalidateQueries({ queryKey: QK.insights });
    },
  });
}
