
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type FoodItem, type DateInput } from '../schema';
import { desc, eq, sql } from 'drizzle-orm';

export const getFoodItems = async (input?: DateInput): Promise<FoodItem[]> => {
  try {
    // Build query with conditional where clause
    const baseQuery = db.select().from(foodItemsTable);
    
    const query = input?.date
      ? baseQuery
          .where(eq(sql`DATE(${foodItemsTable.logged_at})`, input.date))
          .orderBy(desc(foodItemsTable.logged_at))
      : baseQuery.orderBy(desc(foodItemsTable.logged_at));

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch food items:', error);
    throw error;
  }
};
