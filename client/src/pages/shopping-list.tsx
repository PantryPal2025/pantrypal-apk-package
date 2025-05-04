import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingItem } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import GroceryServiceIntegration from '@/components/integrations/grocery-service-integration';

export default function ShoppingList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  
  // Check for hash in URL to switch to grocery services tab
  useEffect(() => {
    if (window.location.hash === '#grocery-services') {
      setActiveTab('services');
    }
  }, []);
  
  // Fetch shopping list items
  const { data: shoppingItems = [], isPending } = useQuery<ShoppingItem[]>({
    queryKey: ['/api/shopping'],
  });
  
  // Add new shopping item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.trim()) return;
    
    try {
      await apiRequest('POST', '/api/shopping', {
        name: newItemQuantity ? `${newItem} (${newItemQuantity})` : newItem,
        completed: false,
        userId: 1 // Demo user
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      setNewItem('');
      setNewItemQuantity('');
      
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
  
  // Toggle shopping item completion status
  const toggleItemComplete = async (id: number, completed: boolean) => {
    try {
      await apiRequest('PATCH', `/api/shopping/${id}`, {
        completed: !completed
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
    } catch (error) {
      console.error('Failed to update shopping item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      });
    }
  };
  
  // Delete shopping item
  const deleteItem = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/shopping/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      toast({
        title: 'Item deleted',
        description: 'Item removed from your shopping list',
      });
    } catch (error) {
      console.error('Failed to delete shopping item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item from shopping list',
        variant: 'destructive',
      });
    }
  };
  
  // Group by completion status
  const pendingItems = shoppingItems.filter(item => !item.completed);
  const completedItems = shoppingItems.filter(item => item.completed);
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Shopping List</h1>
          <p className="text-neutral-600">Keep track of what you need to buy</p>
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
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={() => {
              setActiveTab('services');
              window.location.hash = 'grocery-services';
            }}
          >
            <Icon name="shopping" className="mr-2" size="sm" />
            Connect to Grocery Services
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Shopping List</TabsTrigger>
              <TabsTrigger value="services">Grocery Services</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Items to Buy</CardTitle>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="py-8 text-center">
                      <p className="text-neutral-500">Loading shopping list...</p>
                    </div>
                  ) : pendingItems.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-neutral-500">Your shopping list is empty.</p>
                      <p className="text-neutral-500 text-sm mt-2">Add items using the form on the right.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {pendingItems.map(item => (
                        <li key={item.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                          <div className="flex items-center space-x-3">
                            <Checkbox 
                              id={`item-${item.id}`} 
                              checked={item.completed}
                              onCheckedChange={() => toggleItemComplete(item.id, item.completed)}
                              className="text-primary"
                            />
                            <Label htmlFor={`item-${item.id}`} className="text-base cursor-pointer">
                              {item.name}
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="text-neutral-400 hover:text-destructive"
                          >
                            <Icon name="close" size="sm" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {completedItems.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-base font-medium mb-3 text-neutral-600">Purchased Items</h3>
                      <ul className="space-y-2">
                        {completedItems.map(item => (
                          <li key={item.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                id={`item-${item.id}`} 
                                checked={item.completed}
                                onCheckedChange={() => toggleItemComplete(item.id, item.completed)}
                                className="text-primary"
                              />
                              <Label htmlFor={`item-${item.id}`} className="text-base cursor-pointer line-through text-neutral-400">
                                {item.name}
                              </Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                              className="text-neutral-400 hover:text-destructive"
                            >
                              <Icon name="close" size="sm" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services">
              <GroceryServiceIntegration />
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Add to Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g., Olive oil"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="item-quantity">Quantity (Optional)</Label>
                  <Input
                    id="item-quantity"
                    placeholder="e.g., 1 bottle"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Icon name="plus" className="mr-2" size="sm" />
                  Add Item
                </Button>
              </form>
              
              <div className="mt-8">
                <h3 className="text-base font-medium mb-3 text-neutral-600">Shopping Tips</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Check your inventory before shopping to avoid duplicates
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Group items by store section for efficient shopping
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Mark items as purchased as you shop
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
