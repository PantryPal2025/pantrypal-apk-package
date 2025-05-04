import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Recipe } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealSuggestionCard from '@/components/dashboard/meal-suggestion-card';
import AddRecipeDialog from '@/components/recipes/add-recipe-dialog';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch all recipes
  const { data: recipes = [], isPending } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
  });
  
  // Fetch suggested recipes based on expiring ingredients
  const { data: suggestedRecipes = [] } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes/suggested'],
  });
  
  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Recipes</h1>
          <p className="text-neutral-600">Find and save your favorite meal ideas</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <NavDropdown 
            trigger={
              <button className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
                <span className="text-sm mr-1">Pages</span>
                <Icon name="menu" size="sm" />
              </button>
            }
          />
          <AddRecipeDialog />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative w-full md:w-96">
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Icon
            name="food"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size="sm"
          />
        </div>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Recipes</TabsTrigger>
              <TabsTrigger value="suggested">Suggested For You</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isPending ? (
                <div className="py-8 text-center">
                  <p className="text-neutral-500">Loading recipes...</p>
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-neutral-500 mb-4">No recipes found.</p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map(recipe => (
                    <MealSuggestionCard
                      key={recipe.id}
                      id={recipe.id}
                      name={recipe.name}
                      imageUrl={recipe.imageUrl || 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                      prepTime={recipe.prepTime || 0}
                      cookTime={recipe.cookTime || 0}
                      difficulty={recipe.difficulty || 'Easy'}
                      ingredients={JSON.parse(recipe.ingredients)}
                      percentIngredients={85} // Example value
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="suggested">
              {suggestedRecipes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-neutral-500">No suggested recipes available.</p>
                  <p className="text-neutral-500 text-sm mt-2">Add more ingredients to your inventory to get personalized suggestions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestedRecipes.map(recipe => (
                    <MealSuggestionCard
                      key={recipe.id}
                      id={recipe.id}
                      name={recipe.name}
                      imageUrl={recipe.imageUrl || 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                      prepTime={recipe.prepTime || 0}
                      cookTime={recipe.cookTime || 0}
                      difficulty={recipe.difficulty || 'Easy'}
                      ingredients={JSON.parse(recipe.ingredients)}
                      hasAllIngredients={true}
                      percentIngredients={100}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites">
              <div className="py-8 text-center">
                <p className="text-neutral-500">You haven't saved any favorites yet.</p>
                <p className="text-neutral-500 text-sm mt-2">Click the heart icon on any recipe to save it here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Recipe Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Quick & Easy', 'Vegetarian', 'Healthy Options'].map((collection, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-40 bg-neutral-100 flex items-center justify-center">
                <img 
                  src={`https://images.unsplash.com/photo-${index === 0 ? '1490645935967-10de6ba17061' : index === 1 ? '1576021348469-2a192b4ab4ab' : '1570704196108-c3cb38f76a8d'}?auto=format&fit=crop&w=600&q=80`}
                  alt={collection}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{collection}</h3>
                <p className="text-neutral-600 text-sm mb-3">
                  {index === 0 ? 'Meals ready in 30 minutes or less' : 
                   index === 1 ? 'Plant-based delicious recipes' : 
                   'Nutritious and balanced meals'}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View Collection
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
