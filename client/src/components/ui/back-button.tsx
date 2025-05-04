import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = 'Back to Dashboard', className = '' }: BackButtonProps) {
  return (
    <Link href="/">
      <Button 
        variant="ghost" 
        className={`text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 mb-4 -ml-2 ${className}`}
      >
        <Icon name="menu" className="rotate-90 mr-1" size="sm" />
        {label}
      </Button>
    </Link>
  );
}