import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@/components/ui/icon';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface ProductInfo {
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;
  genericName?: string;
  packageQuantity?: string;
  calories?: string;
  fat?: string;
  carbs?: string;
  protein?: string;
  fiber?: string;
  salt?: string;
  sodium?: string;
  sugars?: string;
  saturatedFat?: string;
  servingSize?: string;
  ingredients?: string;
  allergens?: string[];
  nutriScore?: string;
  novaGroup?: string;
  ecoScore?: string;
  environmentalImpact?: string;
  packaging?: string;
  origin?: string;
  labels?: string;
  stores?: string;
  categories?: string;
}

interface PortionData {
  name: string;
  description: string;
  category: string;
  location: typeof StorageLocation[keyof typeof StorageLocation];
  quantity: number;
  unit: typeof MeasurementUnit[keyof typeof MeasurementUnit];
  expirationDate: string;
  notes: string;
  labelName?: string;
}

interface PortionTrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productInfo: ProductInfo;
  baseNotes: string;
  baseCategory: string;
}

export default function PortionTrackingDialog({
  isOpen,
  onClose,
  productInfo,
  baseNotes,
  baseCategory
}: PortionTrackingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Basic info from parent
  const [baseName] = useState(productInfo.name);
  const [baseDescription] = useState(productInfo.brand || '');
  
  // Portion info
  const [portions, setPortions] = useState<PortionData[]>([
    {
      name: `${productInfo.name} (Portion 1)`,
      description: productInfo.brand || '',
      category: baseCategory,
      location: StorageLocation.FREEZER,
      quantity: 1,
      unit: MeasurementUnit.LB,
      expirationDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
      notes: baseNotes,
      labelName: 'Portion 1'
    }
  ]);
  
  // Calendar popover states
  const [datePopoverOpen, setDatePopoverOpen] = useState<number[]>([]);
  
  // Function to toggle date popover for a specific portion
  const toggleDatePopover = (index: number) => {
    setDatePopoverOpen(prev => {
      const newState = [...prev];
      if (newState.includes(index)) {
        return newState.filter(idx => idx !== index);
      } else {
        newState.push(index);
        return newState;
      }
    });
  };
  
  // Add a new portion
  const addPortion = () => {
    setPortions(prev => {
      const newPortions = [...prev];
      const newIndex = newPortions.length + 1;
      
      // Copy values from the last portion, but with a new label
      const lastPortion = newPortions[newPortions.length - 1];
      
      newPortions.push({
        ...lastPortion,
        name: `${baseName} (Portion ${newIndex})`,
        labelName: `Portion ${newIndex}`
      });
      
      return newPortions;
    });
  };
  
  // Remove a portion
  const removePortion = (index: number) => {
    if (portions.length <= 1) {
      return; // Keep at least one portion
    }
    
    setPortions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Update a specific portion
  const updatePortion = (index: number, field: keyof PortionData, value: any) => {
    setPortions(prev => {
      const newPortions = [...prev];
      newPortions[index] = {
        ...newPortions[index],
        [field]: value
      };
      
      // If updating the label, also update the name
      if (field === 'labelName') {
        newPortions[index].name = `${baseName} (${value})`;
      }
      
      return newPortions;
    });
  };
  
  // Submit all portions to inventory
  const handleSubmit = async () => {
    // Validate all portions
    const hasEmptyLabels = portions.some(portion => !portion.labelName?.trim());
    
    if (hasEmptyLabels) {
      toast({
        title: "Empty portion label",
        description: "Please provide a label for each portion",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Submit each portion as a separate inventory item
      for (const portion of portions) {
        const data = {
          name: portion.name,
          description: portion.description,
          category: portion.category,
          location: portion.location,
          quantity: portion.quantity,
          unit: portion.unit,
          expirationDate: portion.expirationDate,
          notes: portion.notes + `\nCustom Portion: ${portion.labelName}`
        };
        
        const response = await apiRequest('POST', '/api/inventory', data);
        
        if (!response.ok) {
          throw new Error(`Error adding portion: ${portion.labelName}`);
        }
        
        // Track inventory action in gamification system
        try {
          const usedBarcode = portion.notes?.includes('Barcode:') || false;
          await apiRequest('POST', '/api/gamification/challenges/progress', {
            action: 'inventory_add',
            usedBarcode
          });
        } catch (err) {
          console.error('Error updating gamification:', err);
        }
      }
      
      // Refresh inventory and gamification data
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/challenges'] });
      
      toast({
        title: "Success",
        description: `Added ${portions.length} portions to your inventory`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding portions:', error);
      toast({
        title: "Error",
        description: "Failed to add portions to inventory",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portion Tracking</DialogTitle>
          <DialogDescription>
            Divide your bulk meat into individual portions for freezer storage
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{baseName}</h3>
              {baseDescription && <p className="text-neutral-500 text-sm">{baseDescription}</p>}
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-neutral-50 text-sm mb-4">
            <p className="mb-2 font-medium flex items-center text-neutral-700">
              <Icon name="info" className="mr-1" size="sm" />
              Bulk Meat Portioning
            </p>
            <p className="text-neutral-600 mb-2">
              Create separate inventory entries for each portion of your bulk meat package.
              Each portion will be tracked individually in your inventory.
            </p>
            <p className="text-neutral-600">
              This is perfect for when you buy a large package of meat and divide it into smaller
              freezer bags.
            </p>
          </div>
          
          {portions.map((portion, index) => (
            <div 
              key={index} 
              className="border rounded-md p-4 relative"
            >
              <div className="absolute top-3 right-3 flex items-center space-x-1">
                {portions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400 hover:text-destructive"
                    onClick={() => removePortion(index)}
                  >
                    <Icon name="close" size="sm" />
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`label-${index}`}>Portion Label</Label>
                    <Input
                      id={`label-${index}`}
                      value={portion.labelName}
                      onChange={(e) => updatePortion(index, 'labelName', e.target.value)}
                      placeholder="e.g., Portion 1, Chicken Breast, etc."
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`location-${index}`}>Storage Location</Label>
                    <Select
                      value={portion.location}
                      onValueChange={(value) => updatePortion(index, 'location', value)}
                    >
                      <SelectTrigger id={`location-${index}`} className="mt-1.5">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={StorageLocation.FREEZER}>Freezer</SelectItem>
                        <SelectItem value={StorageLocation.FRIDGE}>Fridge</SelectItem>
                        <SelectItem value={StorageLocation.PANTRY}>Pantry</SelectItem>
                        <SelectItem value={StorageLocation.SPICE_RACK}>Spice Rack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={portion.quantity}
                      onChange={(e) => updatePortion(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`unit-${index}`}>Unit</Label>
                    <Select
                      value={portion.unit}
                      onValueChange={(value) => updatePortion(index, 'unit', value)}
                    >
                      <SelectTrigger id={`unit-${index}`} className="mt-1.5">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MeasurementUnit.LB}>Pound</SelectItem>
                        <SelectItem value={MeasurementUnit.OZ}>Ounce</SelectItem>
                        <SelectItem value={MeasurementUnit.G}>Gram</SelectItem>
                        <SelectItem value={MeasurementUnit.KG}>Kilogram</SelectItem>
                        <SelectItem value={MeasurementUnit.COUNT}>Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`expdate-${index}`}>Expires</Label>
                    <Popover 
                      open={datePopoverOpen.includes(index)}
                      onOpenChange={() => toggleDatePopover(index)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-1.5 justify-start text-left font-normal"
                        >
                          <Icon name="calendar" className="mr-2 h-4 w-4" />
                          {portion.expirationDate
                            ? format(new Date(portion.expirationDate), 'PP')
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={portion.expirationDate ? new Date(portion.expirationDate) : undefined}
                          onSelect={(date) => {
                            updatePortion(index, 'expirationDate', date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
                            toggleDatePopover(index);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={addPortion}
            className="flex items-center justify-center"
          >
            <Icon name="plus" className="mr-2" size="sm" />
            Add Another Portion
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            Add All Portions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}