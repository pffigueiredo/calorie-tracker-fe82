
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { FoodItem, CreateFoodItemInput, DailySummary } from '../../server/src/schema';

function App() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  );

  const [formData, setFormData] = useState<CreateFoodItemInput>({
    name: '',
    calories: 0
  });

  // Load food items for selected date
  const loadFoodItems = useCallback(async () => {
    try {
      const result = await trpc.getFoodItems.query({ date: selectedDate });
      setFoodItems(result);
    } catch (error) {
      console.error('Failed to load food items:', error);
    }
  }, [selectedDate]);

  // Load daily summary for selected date
  const loadDailySummary = useCallback(async () => {
    try {
      const result = await trpc.getDailySummary.query({ date: selectedDate });
      setDailySummary(result);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    }
  }, [selectedDate]);

  // Load data when component mounts or date changes
  useEffect(() => {
    loadFoodItems();
    loadDailySummary();
  }, [loadFoodItems, loadDailySummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.calories <= 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await trpc.createFoodItem.mutate(formData);
      setFoodItems((prev: FoodItem[]) => [response, ...prev]);
      
      // Update daily summary by reloading it
      await loadDailySummary();
      
      // Reset form
      setFormData({
        name: '',
        calories: 0
      });
    } catch (error) {
      console.error('Failed to create food item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateTime: Date): string => {
    return dateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍎 Calorie Tracker</h1>
          <p className="text-gray-600">Track your daily food intake and stay healthy!</p>
        </div>

        {/* Date Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📅 Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-2">{formatDate(selectedDate)}</p>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        {dailySummary && (
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-xl">📊 Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">{dailySummary.total_calories}</div>
                  <div className="text-blue-100">Total Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{dailySummary.items_count}</div>
                  <div className="text-blue-100">Food Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Food Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">🍽️ Log Food Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Food name (e.g., Apple, Chicken Breast)"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFoodItemInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Calories"
                    value={formData.calories || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFoodItemInput) => ({ 
                        ...prev, 
                        calories: parseInt(e.target.value) || 0 
                      }))
                    }
                    min="1"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.name.trim() || formData.calories <= 0}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700"
              >
                {isLoading ? '🔄 Adding...' : '➕ Add Food Item'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Food Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🥗 Food Log - {formatDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {foodItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🍽️</div>
                <p>No food items logged for this date.</p>
                <p className="text-sm">Add your first meal above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {foodItems.map((item: FoodItem) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Logged at {formatTime(item.logged_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {item.calories} cal
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {foodItems.length > 1 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <span className="font-semibold text-green-800">
                        Total for {formatDate(selectedDate)}:
                      </span>
                      <Badge className="bg-green-600">
                        {foodItems.reduce((sum: number, item: FoodItem) => sum + item.calories, 0)} calories
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🌟 Stay healthy and keep tracking! 🌟</p>
        </div>
      </div>
    </div>
  );
}

export default App;
