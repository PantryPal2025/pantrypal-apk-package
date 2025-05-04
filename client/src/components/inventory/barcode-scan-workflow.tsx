import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ManualProductEntry from './manual-product-entry';
import { EnhancedProductData } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScanWorkflowProps {
  onProductComplete: (product: EnhancedProductData) => void;
}

export function BarcodeScanWorkflow({ onProductComplete }: BarcodeScanWorkflowProps) {
  const [entryOpen, setEntryOpen] = useState(false);
  const { toast } = useToast();

  // Handle completion
  const handleProductComplete = (product: EnhancedProductData) => {
    // Send the product up to parent
    onProductComplete(product);
    
    // Show success message
    toast({
      title: "Product Added",
      description: `${product.name} has been added to your inventory.`
    });
  };

  return (
    <div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 text-xs"
        onClick={() => setEntryOpen(true)}
      >
        <Search className="h-3.5 w-3.5 mr-1" />
        Find Product
      </Button>

      {/* Manual Entry - guaranteed to work */}
      {entryOpen && (
        <ManualProductEntry
          isOpen={entryOpen}
          onClose={() => setEntryOpen(false)}
          onProductComplete={handleProductComplete}
        />
      )}
    </div>
  );
}