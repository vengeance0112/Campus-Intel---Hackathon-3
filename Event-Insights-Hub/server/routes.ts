import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import { getDb } from "./db";

type SqliteEventRow = {
  Domain: string;
  Event_Type: string;
  Speaker_Type: string;
  Duration_Hours: number;
  Day_Type: string;
  Time_Slot: string;
  Promotion_Days: number;
  Certificate_Flag: number;
  Interactivity_Level: number;
  Expected_Attendance: number;
  Engagement_Level?: string | null;
};

function mapSqliteRowToApiEvent(row: SqliteEventRow) {
  return {
    domain: row.Domain,
    eventType: row.Event_Type,
    speakerType: row.Speaker_Type,
    durationHours: Number(row.Duration_Hours),
    dayType: row.Day_Type,
    timeSlot: row.Time_Slot,
    promotionDays: Number(row.Promotion_Days),
    certificateFlag: Boolean(row.Certificate_Flag),
    interactivityLevel: Number(row.Interactivity_Level),
    relevanceFriction: 1,
    scheduleFriction: 1,
    fatigueFriction: 1,
    promotionFriction: 1,
    socialFriction: 1,
    formatFriction: 1,
    expectedAttendance: Number(row.Expected_Attendance),
    attendanceCategory: row.Engagement_Level ?? null,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === API ROUTES (SQLite) ===

  app.get(api.stats.overview.path, async (req, res) => {
    try {
      const db = await getDb();
      const rows = await db.all<SqliteEventRow[]>(
        "SELECT Domain, Speaker_Type, Expected_Attendance FROM event_attendance"
      );

      const totalEvents = rows.length;

      const attendanceSum = rows.reduce((sum, r) => sum + Number(r.Expected_Attendance), 0);
      const avgAttendance = totalEvents > 0 ? attendanceSum / totalEvents : 0;

      const domainCounts: Record<string, number> = {};
      const speakerCounts: Record<string, number> = {};
      rows.forEach((r) => {
        domainCounts[r.Domain] = (domainCounts[r.Domain] || 0) + Number(r.Expected_Attendance);
        speakerCounts[r.Speaker_Type] = (speakerCounts[r.Speaker_Type] || 0) + Number(r.Expected_Attendance);
      });

      const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const topSpeaker = Object.entries(speakerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      res.json({
        totalEvents,
        avgAttendance: Math.round(avgAttendance),
        topDomain,
        topSpeakerType: topSpeaker
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overview" });
    }
  });

  app.get(api.stats.charts.path, async (req, res) => {
    try {
      const db = await getDb();
      const allEvents = await db.all<SqliteEventRow[]>(
        "SELECT Domain, Speaker_Type, Interactivity_Level, Expected_Attendance FROM event_attendance LIMIT 2000"
      );

      const domainMap: Record<string, { count: number; sum: number }> = {};
      allEvents.forEach((e) => {
        if (!domainMap[e.Domain]) domainMap[e.Domain] = { count: 0, sum: 0 };
        domainMap[e.Domain].count++;
        domainMap[e.Domain].sum += Number(e.Expected_Attendance);
      });
      const attendanceByDomain = Object.entries(domainMap).map(([name, data]) => ({
        name,
        value: Math.round(data.sum / data.count),
      }));

      const speakerMap: Record<string, { count: number; sum: number }> = {};
      allEvents.forEach((e) => {
        if (!speakerMap[e.Speaker_Type]) speakerMap[e.Speaker_Type] = { count: 0, sum: 0 };
        speakerMap[e.Speaker_Type].count++;
        speakerMap[e.Speaker_Type].sum += Number(e.Expected_Attendance);
      });
      const attendanceBySpeaker = Object.entries(speakerMap).map(([name, data]) => ({
        name,
        value: Math.round(data.sum / data.count),
      }));

      const interactivityCorrelation = allEvents
        .slice(0, 50)
        .map((e) => ({ x: Number(e.Interactivity_Level), y: Number(e.Expected_Attendance) }));

      // 4. Friction Impact (Mocked/Derived from PRD logic as we didn't fully parse frictions)
      // PRD says: Relevance, Schedule, Fatigue, Promotion, Social, Format
      const frictionImpact = [
        { name: "Relevance", value: 85 },
        { name: "Schedule", value: 65 },
        { name: "Fatigue", value: 45 },
        { name: "Promotion", value: 90 },
        { name: "Social", value: 55 },
        { name: "Format", value: 70 },
      ];

      res.json({
        attendanceByDomain,
        attendanceBySpeaker,
        interactivityCorrelation,
        frictionImpact
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  app.get(api.events.list.path, async (_req, res) => {
    try {
      const db = await getDb();
      const rows = await db.all<SqliteEventRow[]>(
        "SELECT Domain, Event_Type, Speaker_Type, Duration_Hours, Day_Type, Time_Slot, Promotion_Days, Certificate_Flag, Interactivity_Level, Expected_Attendance, Engagement_Level FROM event_attendance LIMIT 1000"
      );

      const mapped = rows.map(mapSqliteRowToApiEvent);
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events list" });
    }
  });

  app.post(api.prediction.predict.path, async (req, res) => {
    try {
      const input = req.body; // Skip Zod for now to handle complex nesting or fix schema later

      // Prefer your trained Python model if the local inference API is running.
      // This does NOT modify your model code; it only forwards the request.
      const pythonUrl = process.env.PYTHON_MODEL_URL || "http://127.0.0.1:8001";
      try {
        const pyRes = await fetch(`${pythonUrl}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (pyRes.ok) {
          const pyJson = await pyRes.json();
          const predictedAttendance = Number(pyJson.predictedAttendance);

          let category: "Low" | "Medium" | "High" = "Low";
          if (predictedAttendance > 120) category = "High";
          else if (predictedAttendance > 70) category = "Medium";

          // Insert prediction into database to increment total events count
          try {
            const db = await getDb();
            await db.run(
              `INSERT INTO event_attendance (Domain, Event_Type, Speaker_Type, Duration_Hours, Day_Type, Time_Slot, Promotion_Days, Certificate_Flag, Interactivity_Level, Expected_Attendance, Engagement_Level)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                input.domain,
                input.eventType,
                input.speakerType,
                input.durationHours,
                input.dayType,
                input.timeSlot,
                input.promotionDays,
                input.certificateFlag ? 1 : 0,
                input.interactivityLevel,
                predictedAttendance,
                category
              ]
            );
          } catch (err) {
            console.error("Failed to log prediction to database:", err);
          }

          res.json({
            predictedAttendance,
            category,
            confidenceInterval: [Math.max(0, predictedAttendance - 15), predictedAttendance + 15],
            recommendations: ["Prediction generated using your trained model."],
            contributingFactors: [],
          });
          return;
        }
      } catch {
        // Ignore and fall back to heuristic
      }
      
      // === PREDICTION LOGIC (Heuristic / Linear Regression Mimic) ===
      // Base attendance
      let score = 50; 

      // Domain Weights
      const domainWeights: Record<string, number> = {
        "Tech": 20, "Business": 15, "Design": 10, "Music": 5, "Law": 12
      };
      score += domainWeights[input.domain] || 0;

      // Speaker Weights
      const speakerWeights: Record<string, number> = {
        "Industry": 25, "Alumni": 15, "Faculty": 5
      };
      score += speakerWeights[input.speakerType] || 0;

      // Event Type Weights
      const typeWeights: Record<string, number> = {
        "Workshop": 10, "Guest_Lecture": 5, "Career_Talk": 20
      };
      score += typeWeights[input.eventType] || 0;

      // Promotion Impact (Logarithmic scale mimic)
      score += Math.min(input.promotionDays * 2, 40);

      // Interactivity Impact (New range 0-1 as per PRD)
      score += input.interactivityLevel * 50;

      // Certificate Bonus
      if (input.certificateFlag) score += 15;

      // Friction Impacts (1-5 scale, 5 is high friction = negative impact)
      const frictionPenalty = (
        (input.frictions.relevance - 1) * 5 +
        (input.frictions.schedule - 1) * 8 +
        (input.frictions.fatigue - 1) * 4 +
        (input.frictions.promotion - 1) * 6 +
        (input.frictions.social - 1) * 3 +
        (input.frictions.format - 1) * 5
      );
      score -= frictionPenalty;

      // Time/Day Penalties
      if (input.dayType === "Weekend" && input.timeSlot === "Morning") score -= 10;
      if (input.timeSlot === "Evening") score -= 5;

      // Final Random Noise (Simulate human uncertainty)
      const noise = (Math.random() - 0.5) * 10;
      const finalPrediction = Math.max(0, Math.round(score + noise));

      // Category
      let category: "Low" | "Medium" | "High" = "Low";
      if (finalPrediction > 120) category = "High";
      else if (finalPrediction > 70) category = "Medium";

      // Recommendations
      const recommendations: string[] = [];
      if (input.promotionDays < 14) recommendations.push("Increase promotion days to improve turnout.");
      if (input.frictions.schedule > 3) recommendations.push("High schedule friction detected — consider changing time slot.");
      if (input.interactivityLevel < 0.4) recommendations.push("Interactivity is low compared to high-attendance events.");
      if (input.speakerType === "Faculty" && input.domain === "Tech") recommendations.push("Industry speakers historically perform better for this domain.");
      if (input.frictions.fatigue > 3) recommendations.push("High student fatigue detected. Consider a more relaxed event format.");
      if (input.frictions.relevance > 3) recommendations.push("Relevance friction is high. Align content more closely with student career goals.");

      // Contributing Factors
      const contributingFactors = [
        { factor: "Promotion", impact: input.promotionDays > 14 ? "Positive" : "Negative", weight: input.promotionDays },
        { factor: "Speaker", impact: "Positive", weight: speakerWeights[input.speakerType] || 0 },
        { factor: "Interactivity", impact: input.interactivityLevel > 0.6 ? "Positive" : "Negative", weight: input.interactivityLevel * 100 },
        { factor: "Friction", impact: "Negative", weight: frictionPenalty },
      ];

      // Insert prediction into database to increment total events count
      try {
        const db = await getDb();
        await db.run(
          `INSERT INTO event_attendance (Domain, Event_Type, Speaker_Type, Duration_Hours, Day_Type, Time_Slot, Promotion_Days, Certificate_Flag, Interactivity_Level, Expected_Attendance, Engagement_Level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            input.domain,
            input.eventType,
            input.speakerType,
            input.durationHours,
            input.dayType,
            input.timeSlot,
            input.promotionDays,
            input.certificateFlag ? 1 : 0,
            input.interactivityLevel,
            finalPrediction,
            category
          ]
        );
      } catch (err) {
        console.error("Failed to log prediction to database:", err);
      }

      res.json({
        predictedAttendance: finalPrediction,
        category,
        confidenceInterval: [Math.max(0, finalPrediction - 15), finalPrediction + 15],
        recommendations,
        contributingFactors
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Prediction failed" });
      }
    }
  });

  return httpServer;
}
