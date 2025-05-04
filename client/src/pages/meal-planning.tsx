import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, startOfWeek, parseISO, isEqual } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { MealType } from "@shared/schema";

// Types for our meal planning data
interface MealPlan {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  userId: number;
  householdId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  userId: number;
  householdId: number | null;
  createdBy: number | null;
  isPublic: boolean | null;
  updatedAt: string | null;
}

interface RecipeNutrition {
  id: number;
  recipeId: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servingSize: string | null;
  servingsPerRecipe: number;
  updatedAt: string;
}

interface PlannedMeal {
  id: number;
  mealPlanId: number;
  recipeId: number | null;
  date: string;
  mealType: string;
  notes: string | null;
  servings: number;
  createdAt: string;
  updatedAt: string;
  recipe?: Recipe;
}

type MealTimeType = typeof MealType[keyof typeof MealType];

interface NewMealPlanFormData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

interface NewPlannedMealFormData {
  recipeId: number | null;
  date: Date;
  mealType: MealTimeType;
  notes: string;
  servings: number;
}

// Component for creating a new meal plan
function NewMealPlanForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NewMealPlanFormData>({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (data: NewMealPlanFormData) => {
      const response = await apiRequest('POST', '/api/meal-plans', {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      toast({
        title: "Meal plan created",
        description: "Your meal plan has been created successfully.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating meal plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMealPlanMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Weekly Meal Plan"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Healthy meals for the week"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Icon name="calendar" className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, 'PPP') : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Icon name="calendar" className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, 'PPP') : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                initialFocus
                disabled={(date) => date < formData.startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={createMealPlanMutation.isPending}>
          {createMealPlanMutation.isPending ? "Creating..." : "Create Meal Plan"}
        </Button>
      </div>
    </form>
  );
}

// Component for adding a meal to a meal plan
function AddMealForm({ mealPlanId, selectedDate, onSuccess }: { 
  mealPlanId: number; 
  selectedDate: Date;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NewPlannedMealFormData>({
    recipeId: null,
    date: selectedDate,
    mealType: MealType.BREAKFAST,
    notes: "",
    servings: 1,
  });
  
  const [isCustomMeal, setIsCustomMeal] = useState(false);
  const [customMealName, setCustomMealName] = useState("");

  // Fetch recipes for dropdown
  const { data: recipes, isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recipes');
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      return response.json();
    },
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/meal-plans/${mealPlanId}/meals`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meal-plans/${mealPlanId}/meals`] });
      toast({
        title: "Meal added",
        description: "Your meal has been added to the plan.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding meal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mealData = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd'),
      notes: isCustomMeal ? `Custom meal: ${customMealName}` : formData.notes,
    };
    
    addMealMutation.mutate(mealData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCustomMeal"
            checked={isCustomMeal}
            onChange={(e) => setIsCustomMeal(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isCustomMeal">Custom meal (not from recipes)</Label>
        </div>
      </div>
      
      {isCustomMeal ? (
        <div className="space-y-2">
          <Label htmlFor="customMealName">Meal Name</Label>
          <Input
            id="customMealName"
            value={customMealName}
            onChange={(e) => setCustomMealName(e.target.value)}
            placeholder="e.g., Takeout Pizza"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="recipeId">Recipe</Label>
          <Select
            value={formData.recipeId?.toString() || ""}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              recipeId: value ? parseInt(value) : null
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a recipe" />
            </SelectTrigger>
            <SelectContent>
              {recipesLoading ? (
                <div className="p-2 text-center">Loading recipes...</div>
              ) : (
                recipes?.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id.toString()}>
                    {recipe.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="mealType">Meal Type</Label>
        <Select
          value={formData.mealType}
          onValueChange={(value: MealTimeType) => setFormData({ ...formData, mealType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MealType.BREAKFAST}>Breakfast</SelectItem>
            <SelectItem value={MealType.LUNCH}>Lunch</SelectItem>
            <SelectItem value={MealType.DINNER}>Dinner</SelectItem>
            <SelectItem value={MealType.SNACK}>Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="servings">Servings</Label>
        <Input
          id="servings"
          type="number"
          min="1"
          value={formData.servings}
          onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
          required
        />
      </div>
      
      {!isCustomMeal && (
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any preparation notes or substitutions"
          />
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={addMealMutation.isPending}>
          {addMealMutation.isPending ? "Adding..." : "Add Meal"}
        </Button>
      </div>
    </form>
  );
}

// Main component for the meal planning page
export default function MealPlanningPage() {
  const [activeMealPlanId, setActiveMealPlanId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewMealPlanDialogOpen, setIsNewMealPlanDialogOpen] = useState(false);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Fetch meal plans
  const { 
    data: mealPlans = [], 
    isLoading: mealPlansLoading,
    error: mealPlansError
  } = useQuery<MealPlan[]>({
    queryKey: ['/api/meal-plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/meal-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch meal plans');
      }
      return response.json();
    },
  });

  // Fetch meals for the active meal plan
  const { 
    data: plannedMeals = [], 
    isLoading: plannedMealsLoading,
    error: plannedMealsError
  } = useQuery<PlannedMeal[]>({
    queryKey: [`/api/meal-plans/${activeMealPlanId}/meals`],
    queryFn: async () => {
      if (!activeMealPlanId) return [];
      const response = await apiRequest('GET', `/api/meal-plans/${activeMealPlanId}/meals`);
      if (!response.ok) {
        throw new Error('Failed to fetch planned meals');
      }
      return response.json();
    },
    enabled: !!activeMealPlanId,
  });

  // Set the first meal plan as active if none is selected
  useEffect(() => {
    if (mealPlans.length > 0 && !activeMealPlanId) {
      setActiveMealPlanId(mealPlans[0].id);
    }
  }, [mealPlans, activeMealPlanId]);

  // Get the active meal plan
  const activeMealPlan = mealPlans.find(plan => plan.id === activeMealPlanId);

  // Filter meals for the selected date
  const mealsForSelectedDate = plannedMeals.filter(meal => {
    const mealDate = parseISO(meal.date);
    return isEqual(
      new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate()),
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    );
  });
  
  // Group meals by meal type
  const mealsByType = {
    [MealType.BREAKFAST]: mealsForSelectedDate.filter(meal => meal.mealType === MealType.BREAKFAST),
    [MealType.LUNCH]: mealsForSelectedDate.filter(meal => meal.mealType === MealType.LUNCH),
    [MealType.DINNER]: mealsForSelectedDate.filter(meal => meal.mealType === MealType.DINNER),
    [MealType.SNACK]: mealsForSelectedDate.filter(meal => meal.mealType === MealType.SNACK),
  };
  
  // Get total calories for the day
  const getDailyTotalCalories = () => {
    // This would come from the nutritional data for each recipe
    // This is a placeholder for now
    return mealsForSelectedDate.reduce((total, meal) => {
      // If we have nutrition data, use it, otherwise estimate
      return total + 0; // Placeholder
    }, 0);
  };

  // Delete a planned meal
  const deletePlannedMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const response = await apiRequest('DELETE', `/api/planned-meals/${mealId}`);
      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meal-plans/${activeMealPlanId}/meals`] });
      toast({
        title: "Meal removed",
        description: "The meal has been removed from your plan.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing meal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteMeal = (mealId: number) => {
    if (confirm("Are you sure you want to remove this meal from your plan?")) {
      deletePlannedMealMutation.mutate(mealId);
    }
  };

  // Render loading state
  if (mealPlansLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading meal plans...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (mealPlansError) {
    return (
      <div className="container py-8">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <h2 className="text-lg font-medium text-red-800">Error loading meal plans</h2>
          <p className="mt-2 text-red-600">{(mealPlansError as Error).message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] })}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Meal Planning</h1>
        <Dialog open={isNewMealPlanDialogOpen} onOpenChange={setIsNewMealPlanDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="plus" className="mr-2 h-4 w-4" />
              New Meal Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Meal Plan</DialogTitle>
              <DialogDescription>
                Create a new meal plan to organize your meals for a specific time period.
              </DialogDescription>
            </DialogHeader>
            <NewMealPlanForm onSuccess={() => setIsNewMealPlanDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {mealPlans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No Meal Plans Yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your first meal plan to start organizing your meals.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsNewMealPlanDialogOpen(true)}
          >
            Create Meal Plan
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Your Meal Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mealPlans.map((plan) => (
                      <Button
                        key={plan.id}
                        variant={plan.id === activeMealPlanId ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => setActiveMealPlanId(plan.id)}
                      >
                        <div>
                          <p>{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(plan.startDate), "MMM d")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {activeMealPlan && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Nutrition Overview</CardTitle>
                    <CardDescription>
                      Daily nutrition summary
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Calories</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">{getDailyTotalCalories()}</p>
                          <Badge variant="outline">Goal: 2000</Badge>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                          <div 
                            className="h-2 rounded-full bg-primary" 
                            style={{ width: `${Math.min((getDailyTotalCalories() / 2000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Placeholders for other nutrition metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Protein</p>
                          <p className="text-sm font-medium">0g</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carbs</p>
                          <p className="text-sm font-medium">0g</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fat</p>
                          <p className="text-sm font-medium">0g</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {activeMealPlan && (
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{activeMealPlan.name}</CardTitle>
                        <CardDescription>
                          {format(new Date(activeMealPlan.startDate), "MMMM d")} - {format(new Date(activeMealPlan.endDate), "MMMM d, yyyy")}
                        </CardDescription>
                      </div>
                      <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Icon name="plus" className="mr-2 h-4 w-4" />
                            Add Meal
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Meal to Plan</DialogTitle>
                            <DialogDescription>
                              Add a meal to your plan for {format(selectedDate, "EEEE, MMMM d, yyyy")}.
                            </DialogDescription>
                          </DialogHeader>
                          <AddMealForm 
                            mealPlanId={activeMealPlanId} 
                            selectedDate={selectedDate}
                            onSuccess={() => setIsAddMealDialogOpen(false)} 
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={(date) => {
                          const planStart = new Date(activeMealPlan.startDate);
                          const planEnd = new Date(activeMealPlan.endDate);
                          return date < planStart || date > planEnd;
                        }}
                        className="rounded-md border"
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Meals for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </h3>
                      {plannedMealsLoading ? (
                        <div className="flex items-center justify-center h-40">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(mealsByType).map(([type, meals]) => (
                            <div key={type}>
                              <h4 className="text-md font-medium capitalize mb-2">
                                {type}
                              </h4>
                              {meals.length === 0 ? (
                                <div className="rounded-md border border-dashed p-4 text-center">
                                  <p className="text-sm text-muted-foreground">No meals planned</p>
                                  <Button
                                    variant="link"
                                    className="mt-2 h-auto p-0"
                                    onClick={() => setIsAddMealDialogOpen(true)}
                                  >
                                    Add {type}
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {meals.map((meal) => (
                                    <Card key={meal.id}>
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <h5 className="font-medium">
                                              {meal.notes?.startsWith('Custom meal:') 
                                                ? meal.notes.substring('Custom meal:'.length).trim()
                                                : meal.recipe?.name || 'Untitled Meal'}
                                            </h5>
                                            {meal.servings > 1 && (
                                              <p className="text-sm text-muted-foreground">
                                                {meal.servings} servings
                                              </p>
                                            )}
                                            {!meal.notes?.startsWith('Custom meal:') && meal.notes && (
                                              <p className="text-sm mt-1">{meal.notes}</p>
                                            )}
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground"
                                            onClick={() => handleDeleteMeal(meal.id)}
                                          >
                                            <Icon name="trash" size="sm" />
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}