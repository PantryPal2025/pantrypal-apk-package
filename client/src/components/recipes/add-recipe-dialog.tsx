import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import AddRecipeForm from './add-recipe-form';

interface AddRecipeDialogProps {
  trigger?: React.ReactNode;
}

export default function AddRecipeDialog({ trigger }: AddRecipeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Icon name="plus" className="mr-2" size="sm" />
            Add Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>
        <AddRecipeForm />
      </DialogContent>
    </Dialog>
  );
}