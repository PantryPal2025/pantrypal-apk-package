import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import LastResortForm from '@/components/inventory/last-resort-form';

interface AddItemDialogProps {
  trigger?: React.ReactNode;
}

export default function AddItemDialog({ trigger }: AddItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccess = () => {
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center">
            <Icon name="plus" className="mr-1" size="sm" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add an item to your inventory. You can look up products by barcode.
          </DialogDescription>
        </DialogHeader>
        <LastResortForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
