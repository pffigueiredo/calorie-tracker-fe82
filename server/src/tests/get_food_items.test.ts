
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type CreateFoodItemInput } from '../schema';
import { getFoodItems } from '../handlers/get_food_items';

// Test food items
const testFoodItems = [
  { name: 'Apple', calories: 95 },
  { name: 'Banana', calories: 105 },
  { name: 'Orange', calories: 62 }
];

describe('getFoodItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all food items when no date filter is provided', async () => {
    // Insert test data
    await db.insert(foodItemsTable)
      .values(testFoodItems)
      .execute();

    const result = await getFoodItems();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBeDefined();
    expect(result[0].calories).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].logged_at).toBeInstanceOf(Date);
  });

  it('should return food items ordered by logged_at descending', async () => {
    // Insert items with specific timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(foodItemsTable)
      .values([
        { name: 'First Item', calories: 100, logged_at: twoHoursAgo },
        { name: 'Latest Item', calories: 200, logged_at: now },
        { name: 'Middle Item', calories: 150, logged_at: oneHourAgo }
      ])
      .execute();

    const result = await getFoodItems();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Latest Item');
    expect(result[1].name).toEqual('Middle Item');
    expect(result[2].name).toEqual('First Item');
  });

  it('should filter food items by specific date', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Insert items for different dates
    await db.insert(foodItemsTable)
      .values([
        { name: 'Today Item', calories: 100, logged_at: today },
        { name: 'Yesterday Item', calories: 200, logged_at: yesterday }
      ])
      .execute();

    // Format today's date as YYYY-MM-DD
    const todayString = today.toISOString().split('T')[0];

    const result = await getFoodItems({ date: todayString });

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Today Item');
    expect(result[0].calories).toEqual(100);
  });

  it('should return empty array when no items match the date filter', async () => {
    // Insert an item for today
    await db.insert(foodItemsTable)
      .values([{ name: 'Today Item', calories: 100 }])
      .execute();

    // Query for a different date
    const result = await getFoodItems({ date: '2020-01-01' });

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no food items exist', async () => {
    const result = await getFoodItems();

    expect(result).toHaveLength(0);
  });

  it('should handle date filter with multiple items on same date', async () => {
    const targetDate = new Date('2024-01-15T10:00:00Z');
    const otherDate = new Date('2024-01-16T10:00:00Z');

    // Insert items for the same date at different times
    await db.insert(foodItemsTable)
      .values([
        { name: 'Morning Snack', calories: 50, logged_at: new Date('2024-01-15T08:00:00Z') },
        { name: 'Lunch', calories: 400, logged_at: new Date('2024-01-15T12:00:00Z') },
        { name: 'Evening Snack', calories: 100, logged_at: new Date('2024-01-15T18:00:00Z') },
        { name: 'Other Day Item', calories: 200, logged_at: otherDate }
      ])
      .execute();

    const result = await getFoodItems({ date: '2024-01-15' });

    expect(result).toHaveLength(3);
    // Check that results are ordered by time (descending)
    expect(result[0].name).toEqual('Evening Snack');
    expect(result[1].name).toEqual('Lunch');
    expect(result[2].name).toEqual('Morning Snack');
  });
});
