import { db } from "./db";
import { events, predictions, type InsertEvent, type Event, type InsertPrediction } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(): Promise<Event[]>;
  getEventStats(): Promise<any>; // Aggregated stats
  
  // Predictions
  logPrediction(prediction: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).limit(1000); // Limit for performance on frontend
  }

  async getEventStats(): Promise<any> {
    const totalEvents = await db.select({ count: sql<number>`count(*)` }).from(events);
    const avgAttendance = await db.select({ avg: sql<number>`avg(${events.expectedAttendance})` }).from(events);
    
    // Simple aggregations can be done here or in memory for speed if dataset is small (<10k)
    // For this MVP, we'll fetch meaningful subsets in routes.
    return {
      total: totalEvents[0].count,
      avg: avgAttendance[0].avg
    };
  }

  async logPrediction(prediction: any): Promise<void> {
    await db.insert(predictions).values(prediction);
  }
}

export const storage = new DatabaseStorage();
