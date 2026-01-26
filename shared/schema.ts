import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";

// === SETTINGS (Pricing) ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  priceExterior: integer("price_exterior").notNull().default(10),
  priceInterior: integer("price_interior").notNull().default(5),
  priceScreens: integer("price_screens").notNull().default(3),
  priceSills: integer("price_sills").notNull().default(3),
  priceGutters: integer("price_gutters").notNull().default(50),
  priceSolar: integer("price_solar").notNull().default(10),
  commercialMultiplier: text("commercial_multiplier").notNull().default("1.5"),
  
  // Email Template Settings
  emailConfirmationSubject: text("email_confirmation_subject").notNull().default("Booking Confirmation - Utah Valley Window Cleaners"),
  emailConfirmationBody: text("email_confirmation_body").notNull().default("Thank you for your booking! Your appointment is scheduled for {{date}}. Please note: you can change your date up to 2 days before the cleaning. Also, the quoted price is flexible; if you decide to add or subtract windows in person, we will adjust the final total accordingly."),
  daysBeforeReschedule: integer("days_before_reschedule").notNull().default(2),
});

export const insertSettingsSchema = createInsertSchema(settings);
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// === BOOKINGS ===
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  
  // Job Details
  windowCount: integer("window_count").notNull(),
  isCommercial: boolean("is_commercial").notNull().default(false),
  
  // Services Selected
  serviceExterior: boolean("service_exterior").notNull().default(true),
  serviceInterior: boolean("service_interior").notNull().default(false),
  serviceScreens: boolean("service_screens").notNull().default(false),
  serviceSills: boolean("service_sills").notNull().default(false),
  serviceGutters: boolean("service_gutters").notNull().default(false),
  serviceSolar: boolean("service_solar").notNull().default(false),
  solarPanelCount: integer("solar_panel_count").default(0),
  
  // Quote & Schedule
  totalPrice: integer("total_price").notNull(), // Stored price at time of booking
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).notNull().default("pending"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true, 
  status: true 
}).extend({
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  windowCount: z.coerce.number().min(1),
  solarPanelCount: z.coerce.number().optional(),
  totalPrice: z.coerce.number(),
  scheduledDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
