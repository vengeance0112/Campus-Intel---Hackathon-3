import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Historical Event Data (from CSV)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(), // Tech, Law, Business, etc.
  eventType: text("event_type").notNull(), // Workshop, Guest Lecture, etc.
  speakerType: text("speaker_type").notNull(), // Industry, Faculty, Alumni
  durationHours: real("duration_hours").notNull(),
  dayType: text("day_type").notNull(), // Weekday, Weekend
  timeSlot: text("time_slot").notNull(), // Morning, Afternoon, Evening
  promotionDays: integer("promotion_days").notNull(),
  certificateFlag: boolean("certificate_flag").notNull(),
  interactivityLevel: real("interactivity_level").notNull(), // 0-1
  
  // Frictions (Simplified as averages or individual columns if needed, keeping key ones)
  relevanceFriction: integer("relevance_friction").default(1),
  scheduleFriction: integer("schedule_friction").default(1),
  fatigueFriction: integer("fatigue_friction").default(1),
  promotionFriction: integer("promotion_friction").default(1),
  socialFriction: integer("social_friction").default(1),
  formatFriction: integer("format_friction").default(1),

  expectedAttendance: integer("expected_attendance").notNull(),
  attendanceCategory: text("attendance_category"), // Low, Medium, High (Derived)
});

// Prediction Logs
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  eventType: text("event_type").notNull(),
  speakerType: text("speaker_type").notNull(),
  predictedAttendance: integer("predicted_attendance").notNull(),
  confidenceLow: integer("confidence_low"),
  confidenceHigh: integer("confidence_high"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });

// === TYPES ===
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

// API Types
export type PredictionRequest = {
  domain: string;
  eventType: string;
  speakerType: string;
  durationHours: number;
  dayType: string;
  timeSlot: string;
  promotionDays: number;
  certificateFlag: boolean;
  interactivityLevel: number;
  // Frictions for "what-if" scenarios
  frictions: {
    relevance: number;
    schedule: number;
    fatigue: number;
    promotion: number;
    social: number;
    format: number;
  }
};

export type PredictionResponse = {
  predictedAttendance: number;
  category: "Low" | "Medium" | "High";
  confidenceInterval: [number, number]; // [Low, High]
  factors: { name: string; impact: "Positive" | "Negative"; magnitude: number }[];
  recommendations: string[];
};

export type AnalyticsStats = {
  totalEvents: number;
  avgAttendance: number;
  topDomain: string;
  topDayType: string;
};

export type ChartData = {
  name: string;
  value: number;
  category?: string;
};
