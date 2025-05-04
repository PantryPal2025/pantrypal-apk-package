import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { InventoryItem, ShoppingItem, Recipe } from '@shared/schema';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import AddItemDialog from '@/components/dialogs/add-item-dialog';
import StatsCard from '@/components/dashboard/stats-card';
import ExpiringItem from '@/components/dashboard/expiring-item';
import ShoppingListItem from '@/components/dashboard/shopping-list-item';
import MealSuggestionCard from '@/components/dashboard/meal-suggestion-card';
import UnitConverter from '@/components/dashboard/unit-converter';
import InventoryItemRow from '@/components/inventory/inventory-item-row';
import MainMenu from '@/components/layout/main-menu';
import NavDropdown from '@/components/layout/nav-dropdown';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ProgressSummary } from '@/components/gamification/progress-summary';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const { toast } = useToast();
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [activeLocation, setActiveLocation] = useState('All Items');
  
  // Fetch expiring items
  const { data: expiringItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/expiring'],
  });
  
  // Fetch all inventory items
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });
  
  // Filter items based on active location
  const filteredItems = inventoryItems.filter(item => {
    return activeLocation === 'All Items' || item.location === activeLocation;
  });
  
  // Fetch shopping list
  const { data: shoppingItems = [], isPending: isShoppingListLoading } = useQuery<ShoppingItem[]>({
    queryKey: ['/api/shopping'],
  });
  
  // Fetch suggested recipes
  const { data: suggestedRecipes = [] } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes/suggested'],
  });
  
  // Add shopping item
  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newShoppingItem.trim()) return;
    
    try {
      await apiRequest('POST', '/api/shopping', {
        name: newShoppingItem,
        completed: false,
        userId: 1 // Demo user
      });
      
      // Reset form and refresh shopping list
      setNewShoppingItem('');
      toast({
        title: 'Item added',
        description: 'Added to shopping list successfully',
      });
    } catch (error) {
      console.error('Failed to add shopping item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to shopping list',
        variant: 'destructive',
      });
    }
  };
  
  // Get counts for stats
  const totalItems = inventoryItems.length;
  const expiringCount = expiringItems.length;
  const savedRecipesCount = 37; // Hardcoded for demo
  
  // Get item icon based on category
  const getItemIcon = (category: string): any => {
    switch (category.toLowerCase()) {
      case 'produce': return 'food';
      case 'dairy': return 'cheese';
      case 'bakery': return 'bread';
      default: return 'bowl';
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Dashboard</h1>
          <p className="text-neutral-600">Welcome back! Here's what's happening in your kitchen.</p>
        </div>
        <div className="mt-3 sm:mt-0 flex">
          <NavDropdown 
            trigger={
              <button className="flex items-center px-3 py-1.5 mr-2 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
                <span className="text-sm mr-1">Menu</span>
                <Icon name="menu" size="sm" />
              </button>
            }
          />
          <Link href="/recipes" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            <Icon name="recipes" className="mr-1.5" size="sm" />
            <span>My Recipes</span>
          </Link>
        </div>
      </div>
      
      {expiringItems.length > 0 && (
        <div className="bg-warning bg-opacity-10 border-l-4 border-warning text-warning-800 p-4 rounded-lg mb-6 flex items-start">
          <Icon name="error" className="text-warning mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium">Expiring Soon</h4>
            <p className="text-sm">
              You have {expiringItems.length} items expiring in the next 3 days.{' '}
              <Link href="/inventory" className="underline">
                Check now
              </Link>
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Items"
          value={totalItems}
          icon="food"
          iconColor="primary"
          trend={{ value: "12% from last week", positive: true }}
        />
        
        <StatsCard
          title="Expiring Soon"
          value={expiringCount}
          icon="time"
          iconColor="danger"
          trend={{ value: "3 more than last week", positive: false }}
        />
        
        <StatsCard
          title="Saved Recipes"
          value={savedRecipesCount}
          icon="bookmark"
          iconColor="secondary"
          trend={{ value: "4 new this month", positive: true }}
        />
        
        <StatsCard
          title="Saved this Month"
          value="$45.20"
          icon="money"
          iconColor="success"
        />
      </div>
      
      <MainMenu />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="mb-8">
            <ProgressSummary />
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Expiring Soon</h2>
              <Link href="/inventory" className="text-primary text-sm hover:underline">
                View All
              </Link>
            </div>
            
            <div className="p-5">
              {expiringItems.length === 0 ? (
                <p className="text-neutral-500 text-sm">No items expiring soon. Well done!</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {expiringItems.slice(0, 4).map(item => (
                    <ExpiringItem
                      key={item.id}
                      name={item.name}
                      expirationDate={new Date(item.expirationDate!)}
                      icon={getItemIcon(item.category)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Shopping List</h2>
              <Link href="/shopping" className="text-primary text-sm hover:underline">
                View All
              </Link>
            </div>
            
            <div className="p-5">
              {isShoppingListLoading ? (
                <p className="text-neutral-500 text-sm">Loading shopping list...</p>
              ) : shoppingItems.length === 0 ? (
                <p className="text-neutral-500 text-sm">Your shopping list is empty.</p>
              ) : (
                <ul className="space-y-2">
                  {shoppingItems.slice(0, 5).map(item => (
                    <ShoppingListItem
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      completed={item.completed ?? false}
                    />
                  ))}
                </ul>
              )}
              
              <form onSubmit={handleAddShoppingItem} className="mt-4 relative">
                <Input
                  type="text"
                  placeholder="Add new item..."
                  className="w-full pr-12 pl-4 py-2"
                  value={newShoppingItem}
                  onChange={(e) => setNewShoppingItem(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                >
                  <Icon name="plusCircle" size="lg" />
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Meal Suggestions</h2>
              <Button variant="outline" className="text-primary bg-primary bg-opacity-10 rounded-lg text-sm flex items-center">
                <Icon name="refresh" className="mr-1" size="sm" />
                Refresh
              </Button>
            </div>
            
            <div className="p-5">
              <p className="text-neutral-600 mb-4">Based on your expiring ingredients, we suggest:</p>
              
              {suggestedRecipes.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  No meal suggestions available. Try adding more ingredients to your inventory.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedRecipes.slice(0, 2).map(recipe => (
                    <MealSuggestionCard
                      key={recipe.id}
                      id={recipe.id}
                      name={recipe.name}
                      imageUrl={recipe.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                      prepTime={recipe.prepTime || 0}
                      cookTime={recipe.cookTime || 0}
                      difficulty={recipe.difficulty || 'Easy'}
                      ingredients={JSON.parse(recipe.ingredients)}
                      hasAllIngredients={true}
                      percentIngredients={90}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Inventory Overview</h2>
              <div className="flex">
                <AddItemDialog 
                  trigger={
                    <Button className="mr-2 px-3 py-1 text-sm flex items-center">
                      <Icon name="plus" className="mr-1" size="sm" />
                      Add Item
                    </Button>
                  }
                />
                <Link href="/inventory" className="text-primary text-sm hover:underline flex items-center">
                  View All
                </Link>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex mb-4 border-b border-neutral-100 pb-3 overflow-x-auto">
                <button 
                  className={`px-4 py-1 mr-2 whitespace-nowrap ${activeLocation === 'All Items' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
                  onClick={() => setActiveLocation('All Items')}
                >
                  All Items
                </button>
                <button 
                  className={`px-4 py-1 mr-2 whitespace-nowrap ${activeLocation === 'Fridge' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
                  onClick={() => setActiveLocation('Fridge')}
                >
                  Fridge
                </button>
                <button 
                  className={`px-4 py-1 mr-2 whitespace-nowrap ${activeLocation === 'Freezer' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
                  onClick={() => setActiveLocation('Freezer')}
                >
                  Freezer
                </button>
                <button 
                  className={`px-4 py-1 mr-2 whitespace-nowrap ${activeLocation === 'Pantry' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
                  onClick={() => setActiveLocation('Pantry')}
                >
                  Pantry
                </button>
                <button 
                  className={`px-4 py-1 mr-2 whitespace-nowrap ${activeLocation === 'Spice Rack' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}
                  onClick={() => setActiveLocation('Spice Rack')}
                >
                  Spices
                </button>
              </div>
              
              <div className="overflow-x-auto">
                {filteredItems.length === 0 ? (
                  <p className="text-neutral-500 text-sm py-4">
                    {inventoryItems.length === 0 ? 
                      "No items in your inventory yet." : 
                      `No items found in ${activeLocation}.`}
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-100">
                      {filteredItems.slice(0, 5).map(item => (
                        <InventoryItemRow
                          key={item.id}
                          item={item}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
