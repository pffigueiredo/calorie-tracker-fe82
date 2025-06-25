
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type DateInput } from '../schema';
import { getDailySummary } from '../handlers/get_daily_summary';

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values for empty date', async () => {
    const input: DateInput = { date: '2024-01-15' };
    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(0);
    expect(result.items_count).toEqual(0);
  });

  it('should use today\'s date when no input provided', async () => {
    const result = await getDailySummary();
    const today = new Date().toISOString().split('T')[0];

    expect(result.date).toEqual(today);
    expect(result.total_calories).toEqual(0);
    expect(result.items_count).toEqual(0);
  });

  it('should calculate summary for date with food items', async () => {
    const testDate = '2024-01-15';
    const targetDate = new Date(`${testDate}T10:00:00.000Z`);

    // Insert test food items for the target date
    await db.insert(foodItemsTable).values([
      { name: 'Apple', calories: 95, logged_at: targetDate },
      { name: 'Banana', calories: 105, logged_at: targetDate },
      { name: 'Orange', calories: 85, logged_at: targetDate }
    ]).execute();

    const result = await getDailySummary({ date: testDate });

    expect(result.date).toEqual(testDate);
    expect(result.total_calories).toEqual(285); // 95 + 105 + 85
    expect(result.items_count).toEqual(3);
  });

  it('should only include items from the specified date', async () => {
    const targetDate = '2024-01-15';
    const targetDateTime = new Date(`${targetDate}T10:00:00.000Z`);
    const otherDate = new Date('2024-01-16T10:00:00.000Z');

    // Insert items for both dates
    await db.insert(foodItemsTable).values([
      { name: 'Apple', calories: 100, logged_at: targetDateTime },
      { name: 'Banana', calories: 150, logged_at: targetDateTime },
      { name: 'Orange', calories: 200, logged_at: otherDate } // Different date
    ]).execute();

    const result = await getDailySummary({ date: targetDate });

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(250); // Only items from target date
    expect(result.items_count).toEqual(2);
  });

  it('should handle date boundary correctly', async () => {
    const testDate = '2024-01-15';
    
    // Insert items at different times of the day
    await db.insert(foodItemsTable).values([
      { name: 'Breakfast', calories: 300, logged_at: new Date(`${testDate}T00:00:00.000Z`) }, // Start of day
      { name: 'Lunch', calories: 500, logged_at: new Date(`${testDate}T12:00:00.000Z`) }, // Middle of day
      { name: 'Dinner', calories: 400, logged_at: new Date(`${testDate}T23:59:59.000Z`) }, // End of day
      { name: 'Next Day', calories: 200, logged_at: new Date('2024-01-16T00:00:00.000Z') } // Next day
    ]).execute();

    const result = await getDailySummary({ date: testDate });

    expect(result.date).toEqual(testDate);
    expect(result.total_calories).toEqual(1200); // Only items from the target date
    expect(result.items_count).toEqual(3);
  });

  it('should handle undefined input correctly', async () => {
    const result = await getDailySummary(undefined);
    const today = new Date().toISOString().split('T')[0];

    expect(result.date).toEqual(today);
    expect(result.total_calories).toEqual(0);
    expect(result.items_count).toEqual(0);
  });
});
