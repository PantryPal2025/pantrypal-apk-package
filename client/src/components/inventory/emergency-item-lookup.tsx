import React, { useState, FormEvent } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { FoodCategory, StorageLocation, MeasurementUnit } from '@shared/schema';

// This is the ABSOLUTE simplest possible implementation
// Just a RELIABLE lookup form that sends data back to the parent

type EmergencyItemLookupProps = {
  onSuccess: (data: any) => void;
  onClose: () => void;
  isOpen: boolean;
};

export function EmergencyItemLookup({ onSuccess, onClose, isOpen }: EmergencyItemLookupProps) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      alert('Please enter a barcode');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API
      const response = await apiRequest('GET', `/api/products/barcode/${barcode}`);
      
      if (!response.ok) {
        throw new Error('Error looking up barcode');
      }
      
      const data = await response.json();
      
      if (data && data.product) {
        // Process the data
        const { product } = data;
        
        // Build product object
        const result = {
          name: product.product_name || 'Unknown Product',
          description: product.brands || '',
          category: FoodCategory.OTHER,
          location: StorageLocation.PANTRY,
          quantity: 1,
          unit: MeasurementUnit.COUNT,
          expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
          notes: `Barcode: ${barcode}\n${product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : ''}`
        };
        
        // Send result to parent
        onSuccess(result);
        onClose();
      } else {
        // Create a basic product
        const result = {
          name: 'Unknown Product',
          description: '',
          category: FoodCategory.OTHER,
          location: StorageLocation.PANTRY,
          quantity: 1,
          unit: MeasurementUnit.COUNT,
          expirationDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
          notes: `Barcode: ${barcode}`
        };
        
        onSuccess(result);
        onClose();
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      alert('Error looking up product. Please try again or enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg w-full max-w-md" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Look up Product by Barcode</h3>
          <button 
            className="text-gray-400 hover:text-gray-600" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter Barcode
              </label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter product barcode"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                disabled={loading}
              >
                {loading ? 'Looking up...' : 'Look up'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}