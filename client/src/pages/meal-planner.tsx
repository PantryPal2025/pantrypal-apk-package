import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Recipe } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { format, addDays, startOfWeek } from 'date-fns';

export default function MealPlanner() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Fetch recipes for meal suggestions
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
  });
  
  // For demo purposes - in a real app, this would be stored/fetched from backend
  const [mealPlan, setMealPlan] = useState<{
    [date: string]: {
      breakfast?: Recipe;
      lunch?: Recipe;
      dinner?: Recipe;
    }
  }>({});
  
  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      dayName: format(date, 'EEEE'),
      dateFormatted: format(date, 'MMM d'),
      key: format(date, 'yyyy-MM-dd')
    };
  });
  
  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };
  
  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };
  
  // Get a random recipe for a meal (simplified for demo)
  const suggestRecipe = (dayKey: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (recipes.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const recipe = recipes[randomIndex];
    
    setMealPlan(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [mealType]: recipe
      }
    }));
  };
  
  // Clear a meal plan
  const clearMeal = (dayKey: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setMealPlan(prev => {
      const updatedDay = { ...prev[dayKey] };
      delete updatedDay[mealType];
      
      // If day is now empty, remove it from the plan
      if (Object.keys(updatedDay).length === 0) {
        const updatedPlan = { ...prev };
        delete updatedPlan[dayKey];
        return updatedPlan;
      }
      
      return {
        ...prev,
        [dayKey]: updatedDay
      };
    });
  };
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Meal Planner</h1>
          <p className="text-neutral-600">Plan your meals for the week ahead</p>
        </div>
        <div className="mt-3 sm:mt-0">
          <NavDropdown 
            trigger={
              <button className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
                <span className="text-sm mr-1">Pages</span>
                <Icon name="menu" size="sm" />
              </button>
            }
          />
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Week of {format(currentWeekStart, 'MMMM d, yyyy')}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              Previous Week
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next Week
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => (
              <div key={day.key} className="border rounded-lg overflow-hidden">
                <div className={`p-3 text-center ${format(new Date(), 'yyyy-MM-dd') === day.key ? 'bg-primary-light bg-opacity-10' : 'bg-neutral-50'}`}>
                  <h3 className="font-medium">{day.dayName}</h3>
                  <p className="text-sm text-neutral-600">{day.dateFormatted}</p>
                </div>
                
                <div className="p-3 space-y-4">
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                    const meal = mealPlan[day.key]?.[mealType as 'breakfast' | 'lunch' | 'dinner'];
                    
                    return (
                      <div key={mealType} className="border-b pb-3 last:border-0 last:pb-0">
                        <p className="text-xs font-medium text-neutral-500 uppercase mb-1">{mealType}</p>
                        {meal ? (
                          <div>
                            <p className="text-sm font-medium">{meal.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-neutral-500">
                                {meal.prepTime && meal.cookTime ? `${meal.prepTime + meal.cookTime} min` : 'Time N/A'}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => clearMeal(day.key, mealType as 'breakfast' | 'lunch' | 'dinner')}
                              >
                                <Icon name="close" size="xs" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={() => suggestRecipe(day.key, mealType as 'breakfast' | 'lunch' | 'dinner')}
                          >
                            <Icon name="plus" size="xs" className="mr-1" />
                            Add Meal
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Shopping List for Week</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(mealPlan).length === 0 ? (
              <p className="text-neutral-500">Add meals to your weekly plan to generate a shopping list.</p>
            ) : (
              <div>
                <p className="text-neutral-600 mb-4">Based on your meal plan, you'll need:</p>
                <ul className="space-y-2">
                  {/* This would be dynamically generated from meal ingredients in a full app */}
                  <li className="flex items-center space-x-3">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Vegetables: spinach, tomatoes, bell peppers</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Proteins: chicken breast, ground beef, eggs</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Dairy: milk, yogurt, cheese</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Grains: rice, pasta, bread</span>
                  </li>
                </ul>
                <Button className="mt-6">
                  Add All to Shopping List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Meal Prep Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tips">
              <TabsList className="mb-4">
                <TabsTrigger value="tips">Tips</TabsTrigger>
                <TabsTrigger value="schedule">Prep Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tips">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <p className="text-sm">Prep ingredients ahead by washing, chopping, and storing them in containers.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <p className="text-sm">Cook rice, pasta, and grains in bulk and refrigerate to save time during weekdays.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <p className="text-sm">Marinate meat a day in advance for better flavor.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <p className="text-sm">Prepare sauces and dressings separately and store in jars.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <p className="text-sm">Designate one day for batch cooking to minimize daily prep work.</p>
                  </li>
                </ul>
              </TabsContent>
              
              <TabsContent value="schedule">
                {Object.keys(mealPlan).length === 0 ? (
                  <p className="text-neutral-500">Add meals to your weekly plan to generate a prep schedule.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Sunday</h3>
                      <p className="text-sm text-neutral-600">Batch cook: rice, chicken, roasted vegetables</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Wednesday</h3>
                      <p className="text-sm text-neutral-600">Mid-week refresh: prep salad ingredients, cook pasta</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
