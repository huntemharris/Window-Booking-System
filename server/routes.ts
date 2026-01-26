import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { seedDatabase } from "./seed";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed DB
  await seedDatabase();

  // === SETTINGS ===
  app.get(api.settings.get.path, async (_req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.post(api.settings.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === BOOKINGS ===
  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);
      
      // Send confirmation email (mock for now until integration selected)
      const settings = await storage.getSettings();
      console.log(`[Email Sent to ${booking.customerEmail}]`);
      console.log(`Subject: ${settings.emailConfirmationSubject}`);
      const body = settings.emailConfirmationBody.replace("{{date}}", booking.scheduledDate.toLocaleDateString());
      console.log(`Body: ${body}`);
      
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (_req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.get(api.bookings.getAvailability.path, async (_req, res) => {
    // Simple availability: Get all bookings. 
    // In a real app, you'd filter by range. 
    // Here we just return all booked dates so frontend can disable them.
    const allBookings = await storage.getBookings();
    const bookedDates = allBookings.map(b => b.scheduledDate.toISOString());
    res.json(bookedDates);
  });

  return httpServer;
}
