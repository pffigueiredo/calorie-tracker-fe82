
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type CreateFoodItemInput, type FoodItem } from '../schema';

export const createFoodItem = async (input: CreateFoodItemInput): Promise<FoodItem> => {
  try {
    // Insert food item record
    const result = await db.insert(foodItemsTable)
      .values({
        name: input.name,
        calories: input.calories
        // logged_at will use the default timestamp from the schema
      })
      .returning()
      .execute();

    // Return the created food item
    const foodItem = result[0];
    return {
      id: foodItem.id,
      name: foodItem.name,
      calories: foodItem.calories,
      logged_at: foodItem.logged_at
    };
  } catch (error) {
    console.error('Food item creation failed:', error);
    throw error;
  }
};
