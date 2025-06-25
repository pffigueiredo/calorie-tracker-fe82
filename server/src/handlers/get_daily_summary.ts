
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type DailySummary, type DateInput } from '../schema';
import { sql, gte, lt } from 'drizzle-orm';

export const getDailySummary = async (input?: DateInput): Promise<DailySummary> => {
  try {
    // Use provided date or default to today
    const targetDate = input?.date || new Date().toISOString().split('T')[0];
    
    // Create date range for the target date (start of day to start of next day)
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    // Query to get summary statistics for the target date
    const result = await db.select({
      total_calories: sql<number>`COALESCE(SUM(${foodItemsTable.calories}), 0)`,
      items_count: sql<number>`COUNT(${foodItemsTable.id})`
    })
    .from(foodItemsTable)
    .where(
      sql`${foodItemsTable.logged_at} >= ${startOfDay} AND ${foodItemsTable.logged_at} < ${startOfNextDay}`
    )
    .execute();

    const summary = result[0];

    return {
      date: targetDate,
      total_calories: Number(summary.total_calories),
      items_count: Number(summary.items_count)
    };
  } catch (error) {
    console.error('Failed to get daily summary:', error);
    throw error;
  }
};
