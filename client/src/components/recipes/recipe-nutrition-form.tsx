import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

interface RecipeNutrition {
  id?: number;
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
}

interface NutritionGoal {
  id: number;
  userId: number;
  caloriesPerDay: number | null;
  proteinPerDay: number | null;
  carbsPerDay: number | null;
  fatPerDay: number | null;
  fiberPerDay: number | null;
  sugarPerDay: number | null;
  sodiumPerDay: number | null;
}

interface RecipeNutritionFormProps {
  recipeId: number;
  recipeName: string;
}

export default function RecipeNutritionForm({ recipeId, recipeName }: RecipeNutritionFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [useAIAnalysis, setUseAIAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [formData, setFormData] = useState<RecipeNutrition>({
    recipeId,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    sugar: null,
    sodium: null,
    servingSize: null,
    servingsPerRecipe: 1,
  });

  // Fetch existing nutrition data
  const { 
    data: nutritionData, 
    isLoading: isNutritionLoading, 
    isError: isNutritionError 
  } = useQuery({
    queryKey: [`/api/recipes/${recipeId}/nutrition`],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/recipes/${recipeId}/nutrition`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch nutrition data');
        }
        return response.json();
      } catch (error) {
        if ((error as any).message?.includes('404')) {
          return null;
        }
        throw error;
      }
    },
  });

  // Fetch nutrition goals
  const { 
    data: nutritionGoals 
  } = useQuery<NutritionGoal>({
    queryKey: ['/api/nutrition/goals'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/nutrition/goals');
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch nutrition goals');
        }
        return response.json();
      } catch (error) {
        if ((error as any).message?.includes('404')) {
          return null;
        }
        throw error;
      }
    },
  });

  // Set form data when nutrition data is loaded
  useEffect(() => {
    if (nutritionData) {
      setFormData({
        recipeId,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        carbs: nutritionData.carbs,
        fat: nutritionData.fat,
        fiber: nutritionData.fiber,
        sugar: nutritionData.sugar,
        sodium: nutritionData.sodium,
        servingSize: nutritionData.servingSize,
        servingsPerRecipe: nutritionData.servingsPerRecipe,
      });
    }
  }, [nutritionData, recipeId]);

  // Save nutrition data
  const saveNutritionMutation = useMutation({
    mutationFn: async (data: RecipeNutrition & { autoAnalyze?: boolean }) => {
      if (nutritionData) {
        // Update existing nutrition data
        const response = await apiRequest('PATCH', `/api/recipes/${recipeId}/nutrition`, data);
        if (!response.ok) {
          throw new Error('Failed to update nutrition data');
        }
        return response.json();
      } else {
        // Create new nutrition data
        const response = await apiRequest('POST', `/api/recipes/${recipeId}/nutrition`, data);
        if (!response.ok) {
          throw new Error('Failed to create nutrition data');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recipes/${recipeId}/nutrition`] });
      toast({
        title: 'Nutrition data saved',
        description: 'Recipe nutrition information has been updated.',
      });
      setIsEditing(false);
      setIsAnalyzing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving nutrition data',
        description: error.message,
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    },
  });
  
  // AI Analyze nutrition data
  const analyzeNutritionMutation = useMutation({
    mutationFn: async (servings: number) => {
      setIsAnalyzing(true);
      return saveNutritionMutation.mutateAsync({
        ...formData,
        servingsPerRecipe: servings,
        autoAnalyze: true
      });
    },
    onSuccess: (data) => {
      setFormData({
        ...data,
        recipeId
      });
      toast({
        title: 'Analysis complete',
        description: 'Recipe nutrition information has been analyzed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
      setShowAIDialog(false);
    }
  });

  // Handle AI analysis request
  const handleAIAnalysis = () => {
    setShowAIDialog(true);
  };
  
  // Handle AI dialog confirm
  const handleConfirmAIAnalysis = () => {
    analyzeNutritionMutation.mutate(formData.servingsPerRecipe);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveNutritionMutation.mutate(formData);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'servingSize' ? value : value ? parseFloat(value) : null,
    });
  };

  // Calculate percentage of daily value
  const calculateDailyPercentage = (nutrientValue: number | null, dailyGoal: number | null) => {
    if (!nutrientValue || !dailyGoal) return 0;
    return (nutrientValue / dailyGoal) * 100;
  };

  // Format nutrient value
  const formatNutrientValue = (value: number | null, unit: string) => {
    if (value === null) return 'N/A';
    return `${value}${unit}`;
  };

  // Show loading state
  if (isNutritionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutritional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Nutritional Information</CardTitle>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Icon name="pencil" className="mr-2 h-4 w-4" />
            {nutritionData ? 'Edit' : 'Add Nutrition'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories (kcal)</Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.calories ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 250"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servingSize">Serving Size</Label>
                <Input
                  id="servingSize"
                  name="servingSize"
                  value={formData.servingSize ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 cup (240g)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servingsPerRecipe">Servings Per Recipe</Label>
                <Input
                  id="servingsPerRecipe"
                  name="servingsPerRecipe"
                  type="number"
                  min="1"
                  step="any"
                  value={formData.servingsPerRecipe}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  name="protein"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.protein ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbohydrates (g)</Label>
                <Input
                  id="carbs"
                  name="carbs"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.carbs ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  name="fat"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.fat ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 8"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input
                  id="fiber"
                  name="fiber"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.fiber ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sugar">Sugar (g)</Label>
                <Input
                  id="sugar"
                  name="sugar"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.sugar ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sodium">Sodium (mg)</Label>
                <Input
                  id="sodium"
                  name="sodium"
                  type="number"
                  step="any"
                  min="0"
                  value={formData.sodium ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Icon name="brain" className="h-5 w-5 text-primary" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>AI-powered nutritional analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div>
                    <h4 className="text-sm font-medium">AI Nutritional Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      Let AI analyze your recipe ingredients for nutritional values
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Recipe'}
                </Button>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveNutritionMutation.isPending}>
                  {saveNutritionMutation.isPending ? 'Saving...' : 'Save Nutrition'}
                </Button>
              </div>
            </div>
            
            <AlertDialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Analyze Recipe Nutrition</AlertDialogTitle>
                  <AlertDialogDescription>
                    Our AI will analyze the ingredients in "{recipeName}" to estimate its nutritional content.
                    This analysis is based on the recipe's ingredients and may vary from actual values.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="aiServings">Number of servings:</Label>
                    <Input
                      id="aiServings"
                      name="servingsPerRecipe"
                      type="number"
                      min="1"
                      step="any"
                      value={formData.servingsPerRecipe}
                      onChange={handleInputChange}
                      className="w-20"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmAIAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        ) : (
          <>
            {!nutritionData ? (
              <div className="text-center py-6">
                <Icon name="nutrition" className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No nutrition information</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add nutritional details to track calories and macronutrients.
                </p>
                <div className="flex justify-center space-x-4 mt-4">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Icon name="pencil" className="mr-2 h-4 w-4" />
                    Add Manually
                  </Button>
                  <Button variant="default" onClick={handleAIAnalysis}>
                    <Icon name="brain" className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {nutritionData.calories} <span className="text-base font-normal text-muted-foreground">kcal</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      per {nutritionData.servingSize || 'serving'} ({nutritionData.servingsPerRecipe} servings per recipe)
                    </p>
                  </div>
                  
                  {nutritionGoals?.caloriesPerDay && (
                    <Badge variant="outline" className="mt-2 md:mt-0">
                      {Math.round(
                        (nutritionData.calories / nutritionGoals.caloriesPerDay) * 100
                      )}% of daily calories
                    </Badge>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Macronutrients</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Protein</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.protein, 'g')}
                        </span>
                      </div>
                      {nutritionGoals?.proteinPerDay && nutritionData.protein && (
                        <Progress
                          value={Math.min(
                            calculateDailyPercentage(nutritionData.protein, nutritionGoals.proteinPerDay),
                            100
                          )}
                          className="h-2"
                        />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Carbs</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.carbs, 'g')}
                        </span>
                      </div>
                      {nutritionGoals?.carbsPerDay && nutritionData.carbs && (
                        <Progress
                          value={Math.min(
                            calculateDailyPercentage(nutritionData.carbs, nutritionGoals.carbsPerDay),
                            100
                          )}
                          className="h-2"
                        />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Fat</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.fat, 'g')}
                        </span>
                      </div>
                      {nutritionGoals?.fatPerDay && nutritionData.fat && (
                        <Progress
                          value={Math.min(
                            calculateDailyPercentage(nutritionData.fat, nutritionGoals.fatPerDay),
                            100
                          )}
                          className="h-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Nutrients</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Fiber</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.fiber, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sugar</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.sugar, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sodium</span>
                        <span className="text-sm">
                          {formatNutrientValue(nutritionData.sodium, 'mg')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}