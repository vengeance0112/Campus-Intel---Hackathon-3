import { z } from 'zod';
import { insertEventSchema } from './schema';

export const api = {
  stats: {
    overview: {
      method: 'GET' as const,
      path: '/api/stats/overview' as const,
      responses: {
        200: z.object({
          totalEvents: z.number(),
          avgAttendance: z.number(),
          topDomain: z.string(),
          topSpeakerType: z.string(),
        }),
      },
    },
    charts: {
      method: 'GET' as const,
      path: '/api/stats/charts' as const,
      responses: {
        200: z.object({
          attendanceByDomain: z.array(z.object({ name: z.string(), value: z.number() })),
          attendanceBySpeaker: z.array(z.object({ name: z.string(), value: z.number() })),
          interactivityCorrelation: z.array(z.object({ x: z.number(), y: z.number() })), // Scatter
          frictionImpact: z.array(z.object({ name: z.string(), value: z.number() })),
        }),
      },
    },
  },
  prediction: {
    predict: {
      method: 'POST' as const,
      path: '/api/predict' as const,
      input: z.object({
        domain: z.string(),
        eventType: z.string(),
        speakerType: z.string(),
        durationHours: z.number(),
        dayType: z.string(),
        timeSlot: z.string(),
        promotionDays: z.number(),
        certificateFlag: z.boolean(),
        interactivityLevel: z.number(),
        frictions: z.object({
          promotion: z.number(),
          fatigue: z.number(),
          format: z.number(),
          social: z.number(),
          schedule: z.number(),
          relevance: z.number(),
        }),
      }),
      responses: {
        200: z.object({
          predictedAttendance: z.number(),
          category: z.enum(["Low", "Medium", "High"]),
          confidenceInterval: z.tuple([z.number(), z.number()]),
          recommendations: z.array(z.string()),
          contributingFactors: z.array(z.object({
            factor: z.string(),
            impact: z.string(),
            weight: z.number()
          }))
        }),
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      responses: {
        200: z.array(insertEventSchema),
      },
    },
  }
};

// ============================================
// REQUIRED: buildUrl helper — frontend imports this!
// DO NOT FORGET to include this function.
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS — Infer types from schemas
// ============================================
export type PredictionRequest = z.infer<typeof api.prediction.predict.input>;
export type PredictionResponse = z.infer<typeof api.prediction.predict.responses[200]>;
export type NoteInput = any; // Placeholder if needed by other files
export type NoteResponse = any;
export type NoteUpdateInput = any;
export type NotesListResponse = any;
