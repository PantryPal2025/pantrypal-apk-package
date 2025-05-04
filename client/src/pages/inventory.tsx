import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import AddItemDialog from '@/components/dialogs/add-item-dialog';
import InventoryItemRow from '@/components/inventory/inventory-item-row';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Inventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('All Items');
  
  // Fetch all inventory items
  const { data: inventoryItems = [], isPending } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });
  
  // Filter items based on search and active location
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = activeLocation === 'All Items' || 
                           item.location === activeLocation;
    
    return matchesSearch && matchesLocation;
  });
  
  const handleLocationFilter = (location: string) => {
    setActiveLocation(location);
  };
  
  const handleDeleteItem = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/inventory/${id}`, undefined);
      
      // Refresh inventory data
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      
      // Track inventory action in gamification system
      try {
        await apiRequest('POST', '/api/gamification/challenges/progress', {
          action: 'inventory_remove'
        });
        
        // Refresh gamification data
        queryClient.invalidateQueries({ queryKey: ['/api/gamification/points'] });
        queryClient.invalidateQueries({ queryKey: ['/api/gamification/achievements'] });
        queryClient.invalidateQueries({ queryKey: ['/api/gamification/challenges'] });
      } catch (err) {
        console.error('Error updating gamification:', err);
        // Don't block the inventory action even if gamification update fails
      }
      
      toast({
        title: 'Item deleted',
        description: 'Item has been removed from your inventory',
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Get unique locations from inventory items
  const uniqueLocations = Array.from(new Set(inventoryItems.map(item => item.location)));
  const locations = ['All Items', ...uniqueLocations];
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Inventory</h1>
          <p className="text-neutral-600">Manage and track all your food items</p>
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
          <AddItemDialog />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex overflow-x-auto w-full md:w-auto mb-4 md:mb-0 pb-3 md:pb-0">
              {locations.map(location => (
                <button
                  key={location}
                  className={`px-4 py-1 whitespace-nowrap mr-2 ${
                    activeLocation === location
                      ? 'text-primary border-b-2 border-primary font-medium'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                  onClick={() => handleLocationFilter(location)}
                >
                  {location}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search items..."
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
          
          <div className="overflow-x-auto">
            {isPending ? (
              <div className="py-8 text-center">
                <p className="text-neutral-500">Loading inventory items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-neutral-500 mb-4">No items found.</p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-neutral-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Expires</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {filteredItems.map(item => (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
