import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";

interface NutritionGoal {
  id?: number;
  userId: number;
  caloriesPerDay: number | null;
  proteinPerDay: number | null;
  carbsPerDay: number | null;
  fatPerDay: number | null;
  fiberPerDay: number | null;
  sugarPerDay: number | null;
  sodiumPerDay: number | null;
}

export default function NutritionGoalsForm() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [useDefaults, setUseDefaults] = useState(false);
  const [formData, setFormData] = useState<Omit<NutritionGoal, 'id' | 'userId'>>({
    caloriesPerDay: null,
    proteinPerDay: null,
    carbsPerDay: null,
    fatPerDay: null,
    fiberPerDay: null,
    sugarPerDay: null,
    sodiumPerDay: null,
  });

  // Default nutritional values based on a 2000 calorie diet
  const defaultValues = {
    caloriesPerDay: 2000,
    proteinPerDay: 50,  // g
    carbsPerDay: 275,   // g
    fatPerDay: 65,      // g
    fiberPerDay: 28,    // g
    sugarPerDay: 50,    // g
    sodiumPerDay: 2300, // mg
  };

  // Fetch existing nutrition goals
  const { 
    data: nutritionGoals, 
    isLoading: isGoalsLoading, 
    isError: isGoalsError 
  } = useQuery({
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

  // Set form data when nutrition goals are loaded
  useEffect(() => {
    if (nutritionGoals) {
      setFormData({
        caloriesPerDay: nutritionGoals.caloriesPerDay,
        proteinPerDay: nutritionGoals.proteinPerDay,
        carbsPerDay: nutritionGoals.carbsPerDay,
        fatPerDay: nutritionGoals.fatPerDay,
        fiberPerDay: nutritionGoals.fiberPerDay,
        sugarPerDay: nutritionGoals.sugarPerDay,
        sodiumPerDay: nutritionGoals.sodiumPerDay,
      });
    }
  }, [nutritionGoals]);

  // Apply default values when useDefaults is toggled
  useEffect(() => {
    if (useDefaults) {
      setFormData(defaultValues);
    }
  }, [useDefaults]);

  // Save nutrition goals
  const saveGoalsMutation = useMutation({
    mutationFn: async (data: Omit<NutritionGoal, 'id' | 'userId'>) => {
      if (nutritionGoals) {
        // Update existing goals
        const response = await apiRequest('PATCH', '/api/nutrition/goals', data);
        if (!response.ok) {
          throw new Error('Failed to update nutrition goals');
        }
        return response.json();
      } else {
        // Create new goals
        const response = await apiRequest('POST', '/api/nutrition/goals', data);
        if (!response.ok) {
          throw new Error('Failed to create nutrition goals');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/goals'] });
      toast({
        title: 'Nutrition goals saved',
        description: 'Your nutrition goals have been updated.',
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving nutrition goals',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoalsMutation.mutate(formData);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value ? parseFloat(value) : null,
    });
  };

  // Format nutrient value
  const formatNutrientValue = (value: number | null, unit: string) => {
    if (value === null) return 'Not set';
    return `${value}${unit}`;
  };

  // Show loading state
  if (isGoalsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
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
        <div>
          <CardTitle>Nutrition Goals</CardTitle>
          <CardDescription>Set your daily nutrition targets</CardDescription>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Icon name="settings" className="mr-2 h-4 w-4" />
            {nutritionGoals ? 'Edit Goals' : 'Set Goals'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="use-defaults"
                checked={useDefaults}
                onCheckedChange={setUseDefaults}
              />
              <Label htmlFor="use-defaults">Use recommended defaults (2000 calorie diet)</Label>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caloriesPerDay">Daily Calories (kcal)</Label>
                <Input
                  id="caloriesPerDay"
                  name="caloriesPerDay"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.caloriesPerDay ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 2000"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proteinPerDay">Daily Protein (g)</Label>
                  <Input
                    id="proteinPerDay"
                    name="proteinPerDay"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.proteinPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="carbsPerDay">Daily Carbohydrates (g)</Label>
                  <Input
                    id="carbsPerDay"
                    name="carbsPerDay"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.carbsPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 275"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fatPerDay">Daily Fat (g)</Label>
                  <Input
                    id="fatPerDay"
                    name="fatPerDay"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.fatPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 65"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fiberPerDay">Daily Fiber (g)</Label>
                  <Input
                    id="fiberPerDay"
                    name="fiberPerDay"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.fiberPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 28"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sugarPerDay">Daily Sugar (g)</Label>
                  <Input
                    id="sugarPerDay"
                    name="sugarPerDay"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.sugarPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sodiumPerDay">Daily Sodium (mg)</Label>
                  <Input
                    id="sodiumPerDay"
                    name="sodiumPerDay"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.sodiumPerDay ?? ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 2300"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false);
                setUseDefaults(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveGoalsMutation.isPending}>
                {saveGoalsMutation.isPending ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            {!nutritionGoals ? (
              <div className="text-center py-6">
                <Icon name="target" className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No nutrition goals set</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set your daily nutrition targets to track your meals against your goals.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setIsEditing(true)}>
                  Set Nutrition Goals
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">
                    {nutritionGoals.caloriesPerDay ?? 'Not set'} 
                    {nutritionGoals.caloriesPerDay && <span className="text-base font-normal text-muted-foreground"> kcal</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Daily calorie target
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Macronutrient Targets</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Protein</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.proteinPerDay, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Carbohydrates</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.carbsPerDay, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Fat</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.fatPerDay, 'g')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Nutrient Targets</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Fiber</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.fiberPerDay, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sugar</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.sugarPerDay, 'g')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sodium</span>
                        <span className="text-lg">
                          {formatNutrientValue(nutritionGoals.sodiumPerDay, 'mg')}
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