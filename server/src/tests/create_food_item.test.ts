
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type CreateFoodItemInput } from '../schema';
import { createFoodItem } from '../handlers/create_food_item';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateFoodItemInput = {
  name: 'Apple',
  calories: 95
};

describe('createFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food item', async () => {
    const result = await createFoodItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Apple');
    expect(result.calories).toEqual(95);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should save food item to database', async () => {
    const result = await createFoodItem(testInput);

    // Query using proper drizzle syntax
    const foodItems = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, result.id))
      .execute();

    expect(foodItems).toHaveLength(1);
    expect(foodItems[0].name).toEqual('Apple');
    expect(foodItems[0].calories).toEqual(95);
    expect(foodItems[0].logged_at).toBeInstanceOf(Date);
  });

  it('should create food item with different calories', async () => {
    const highCalorieInput: CreateFoodItemInput = {
      name: 'Pizza Slice',
      calories: 300
    };

    const result = await createFoodItem(highCalorieInput);

    expect(result.name).toEqual('Pizza Slice');
    expect(result.calories).toEqual(300);
    expect(result.id).toBeDefined();
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should create food item with zero calories', async () => {
    const zeroCalorieInput: CreateFoodItemInput = {
      name: 'Water',
      calories: 0
    };

    const result = await createFoodItem(zeroCalorieInput);

    expect(result.name).toEqual('Water');
    expect(result.calories).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should set logged_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createFoodItem(testInput);
    const afterCreation = new Date();

    expect(result.logged_at).toBeInstanceOf(Date);
    expect(result.logged_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.logged_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
