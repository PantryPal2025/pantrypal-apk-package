import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Recipe } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import BackButton from '@/components/ui/back-button';

export default function RecipeDetail() {
  // Parse the recipe ID from the route
  const [match, params] = useRoute<{ id: string }>('/recipes/:id');
  const recipeId = parseInt(params?.id || '0');
  
  // State to hold parsed ingredients
  const [parsedIngredients, setParsedIngredients] = useState<string[]>([]);
  
  // Fetch the recipe details
  const { data: recipe, isLoading, error } = useQuery<Recipe>({
    queryKey: ['/api/recipes', recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      return response.json();
    },
    enabled: !!recipeId,
  });
  
  // Parse the ingredients from JSON string when recipe data is loaded
  useEffect(() => {
    if (recipe?.ingredients) {
      try {
        const ingredients = typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients;
        setParsedIngredients(ingredients);
      } catch (error) {
        console.error('Error parsing ingredients:', error);
        setParsedIngredients([]);
      }
    }
  }, [recipe]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error || !recipe) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
        <p className="text-neutral-600 mb-6">
          The recipe you're looking for doesn't exist or has been removed.
        </p>
        <BackButton />
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-6">
        <BackButton />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold font-poppins mb-2">{recipe.name}</h1>
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Icon name="plus" className="mr-2" size="sm" />
              Save
            </Button>
            <Button variant="outline" className="flex items-center">
              <Icon name="link" className="mr-2" size="sm" />
              Share
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="h-64 md:h-80 overflow-hidden">
              <img 
                src={recipe.imageUrl || 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} 
                alt={recipe.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              {recipe.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-neutral-700">{recipe.description}</p>
                </div>
              )}
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <div className="space-y-4">
                  {recipe.instructions.split('\n').map((instruction, index) => (
                    instruction.trim() && (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3 mt-1">
                          <span className="text-primary font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-grow">
                          <p className="text-neutral-700">{instruction}</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-6">
                  <Icon name="time" className="mr-2 text-neutral-500" size="sm" />
                  <div>
                    <p className="text-sm text-neutral-500">Prep Time</p>
                    <p className="font-medium">{recipe.prepTime || 0} mins</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Icon name="dish" className="mr-2 text-neutral-500" size="sm" />
                  <div>
                    <p className="text-sm text-neutral-500">Cook Time</p>
                    <p className="font-medium">{recipe.cookTime || 0} mins</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-neutral-500">Difficulty</p>
                <p className="font-medium">{recipe.difficulty || 'Easy'}</p>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {parsedIngredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 border border-neutral-300 rounded-sm mr-3 mt-0.5"></div>
                    <span className="text-neutral-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="w-full mt-4">
                Add All to Shopping List
              </Button>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">You Might Also Like</h3>
            <p className="text-neutral-500 text-sm">
              Similar recipes will appear here once you've added more recipes to your collection.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}