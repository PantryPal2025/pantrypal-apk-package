import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ProductData, EnhancedProductData } from '@/types/product';
import { FoodCategory, StorageLocation, MeasurementUnit, MeasurementUnitType, FoodCategoryType, StorageLocationType } from '@shared/schema';

interface DialogProps {
  product: ProductData;
  onSave: (data: EnhancedProductData) => void;
  onCancel: () => void;
}

/**
 * A completely self-contained product details dialog that will NOT disappear
 * until you click one of its buttons.
 */
export default function ForcePersistentDialog({ product, onSave, onCancel }: DialogProps) {
  // Create form state
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<MeasurementUnitType>(MeasurementUnit.COUNT);
  const [category, setCategory] = useState<FoodCategoryType>(
    (product.category as FoodCategoryType) || FoodCategory.OTHER
  );
  const [location, setLocation] = useState<StorageLocationType>(StorageLocation.PANTRY);
  const [price, setPrice] = useState(0);
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // This will run exactly once when the component mounts
  useEffect(() => {
    console.log('PRODUCT DIALOG MOUNTED');
    
    // Block navigation attempts while the dialog is open
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log('PRODUCT DIALOG UNMOUNTED');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.body.style.overflow = '';
    };
  }, []);
  
  // Create a save handler
  const handleSave = () => {
    console.log("SAVING PRODUCT DATA");
    const enhancedProduct: EnhancedProductData = {
      ...product,
      quantity,
      unit,
      category,
      location,
      price,
      expirationDate: expDate
    };
    
    onSave(enhancedProduct);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Complete Product Details</h2>
        <p className="text-gray-600 mb-4">Add details for {product.name}</p>
        
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-16 h-16 object-contain bg-gray-100 rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/gray/white?text=No+Image';
            }}
          />
          <div>
            <h3 className="font-medium">{product.name}</h3>
            {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={unit}
                onChange={(e) => {
                  const newUnit = e.target.value as MeasurementUnitType;
                  setUnit(newUnit);
                }}
              >
                {Object.values(MeasurementUnit).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={category}
                onChange={(e) => {
                  const newCategory = e.target.value as FoodCategoryType;
                  setCategory(newCategory);
                }}
              >
                {Object.values(FoodCategory).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Storage Location</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={location}
                onChange={(e) => {
                  const newLocation = e.target.value as StorageLocationType;
                  setLocation(newLocation);
                }}
              >
                {Object.values(StorageLocation).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button 
            type="button"
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleSave}
          >
            Add to Inventory
          </button>
        </div>
      </div>
    </div>
  );
}