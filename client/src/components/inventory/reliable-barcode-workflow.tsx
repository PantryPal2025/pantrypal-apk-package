import { useState } from 'react';
import { SimpleBarcodeScanner } from './simple-barcode-scanner'; 
import ForcePersistentDialog from './force-persistent-dialog';
import { ProductData, EnhancedProductData } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Barcode } from 'lucide-react';

interface ReliableBarcodeWorkflowProps {
  onProductDetailsCompleted: (data: EnhancedProductData) => void;
}

/**
 * A completely rewritten barcode workflow that guarantees the product details
 * dialog will stay open until the user explicitly closes it.
 */
export function ReliableBarcodeWorkflow({ onProductDetailsCompleted }: ReliableBarcodeWorkflowProps) {
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductData | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  // Handle the scan complete event from the barcode scanner
  const handleScanComplete = (productData: ProductData) => {
    console.log("[ReliableBarcodeWorkflow] Scan complete with product:", productData);
    
    // Create nutrition notes
    let notes = '';
    if (productData.nutritionInfo) {
      const nutritionInfo = productData.nutritionInfo;
      notes = 'Nutrition Info:\n';
      
      if (nutritionInfo.calories) notes += `Calories: ${nutritionInfo.calories}kcal\n`;
      if (nutritionInfo.protein) notes += `Protein: ${nutritionInfo.protein}g\n`;
      if (nutritionInfo.carbs) notes += `Carbs: ${nutritionInfo.carbs}g\n`;
      if (nutritionInfo.fat) notes += `Fat: ${nutritionInfo.fat}g\n`;
      
      if (nutritionInfo.ingredients) notes += `Ingredients: ${nutritionInfo.ingredients}\n`;
      
      if (nutritionInfo.allergens && nutritionInfo.allergens.length > 0) {
        notes += `Allergens: ${nutritionInfo.allergens.join(', ')}\n`;
      }
    }
    
    if (productData.barcode) {
      notes += `\nBarcode: ${productData.barcode}`;
    }
    
    // Create an updated product object with notes
    const productWithNotes: ProductData = {
      ...productData,
      notes
    };
    
    // First, close the scanner
    setScannerOpen(false);
    
    // Set the current product
    setCurrentProduct(productWithNotes);
    
    // Force a small delay to ensure state updates properly
    setTimeout(() => {
      // Then show the product details dialog
      setShowProductDetails(true);
      
      console.log("[ReliableBarcodeWorkflow] Product details dialog should now be visible");
    }, 100);
    
    toast({
      title: "Product found",
      description: `${productData.name} found. Please complete the product details.`,
    });
  };
  
  // Handle the save event from the product details dialog
  const handleSaveProductDetails = (enhancedProduct: EnhancedProductData) => {
    console.log("[ReliableBarcodeWorkflow] Saving product details:", enhancedProduct);
    
    // Close the product details dialog
    setShowProductDetails(false);
    
    // Reset the current product
    setCurrentProduct(null);
    
    // Call the parent component's callback
    onProductDetailsCompleted(enhancedProduct);
    
    toast({
      title: "Product details saved",
      description: `${enhancedProduct.name} details have been saved.`,
    });
  };
  
  // Handle the cancel event from the product details dialog
  const handleCancelProductDetails = () => {
    console.log("[ReliableBarcodeWorkflow] Cancelling product details");
    
    // Close the product details dialog
    setShowProductDetails(false);
    
    // Reset the current product
    setCurrentProduct(null);
    
    toast({
      title: "Cancelled",
      description: "Product details have been cancelled.",
    });
  };
  
  return (
    <div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 text-xs"
        onClick={() => setScannerOpen(true)}
      >
        <Barcode className="h-3.5 w-3.5" />
        Scan Barcode
      </Button>
      
      {/* Barcode Scanner */}
      {scannerOpen && (
        <SimpleBarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
      
      {/* Always-visible Product Details Dialog */}
      {currentProduct && showProductDetails && (
        <ForcePersistentDialog
          product={currentProduct}
          onSave={handleSaveProductDetails}
          onCancel={handleCancelProductDetails}
        />
      )}
    </div>
  );
}