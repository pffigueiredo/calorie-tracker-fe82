
import { z } from 'zod';

// Food item schema
export const foodItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  calories: z.number().int().nonnegative(),
  logged_at: z.coerce.date()
});

export type FoodItem = z.infer<typeof foodItemSchema>;

// Input schema for creating food items
export const createFoodItemInputSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.number().int().nonnegative("Calories must be a non-negative integer")
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemInputSchema>;

// Daily summary schema
export const dailySummarySchema = z.object({
  date: z.string(), // Format: YYYY-MM-DD
  total_calories: z.number().int().nonnegative(),
  items_count: z.number().int().nonnegative()
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

// Date input schema for filtering
export const dateInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
});

export type DateInput = z.infer<typeof dateInputSchema>;
