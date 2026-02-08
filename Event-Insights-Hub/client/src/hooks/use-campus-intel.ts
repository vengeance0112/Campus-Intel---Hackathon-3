import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PredictionRequest, type PredictionResponse } from "@shared/routes";
import { z } from "zod";

// ============================================
// DATA HOOKS
// ============================================

// GET /api/stats/overview
export function useStatsOverview() {
  return useQuery({
    queryKey: [api.stats.overview.path],
    queryFn: async () => {
      const res = await fetch(api.stats.overview.path);
      if (!res.ok) throw new Error("Failed to fetch overview stats");
      const data = await res.json();
      return api.stats.overview.responses[200].parse(data);
    },
  });
}

// GET /api/stats/charts
export function useStatsCharts() {
  return useQuery({
    queryKey: [api.stats.charts.path],
    queryFn: async () => {
      const res = await fetch(api.stats.charts.path);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const data = await res.json();
      return api.stats.charts.responses[200].parse(data);
    },
  });
}

// GET /api/events
export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events list");
      const data = await res.json();
      return api.events.list.responses[200].parse(data);
    },
  });
}

// POST /api/predict
export function usePredictAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PredictionRequest) => {
      // Validate input before sending using the schema from routes if available, 
      // or rely on server response. The input schema is: api.prediction.predict.input
      const validatedInput = api.prediction.predict.input.parse(data);
      
      const res = await fetch(api.prediction.predict.path, {
        method: api.prediction.predict.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedInput),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Prediction failed: ${errorText}`);
      }

      const responseData = await res.json();
      return api.prediction.predict.responses[200].parse(responseData);
    },
    // Optional: invalidate stats if a prediction saves something to history
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: [api.stats.overview.path] });
    }
  });
}
