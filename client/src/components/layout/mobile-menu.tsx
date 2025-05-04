import { Link, useLocation } from 'wouter';
import { Icon } from '@/components/ui/icon';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  
  const NAV_ITEMS = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Inventory', path: '/inventory', icon: 'inventory' },
    { name: 'Shopping List', path: '/shopping', icon: 'shopping' },
    { name: 'Recipes', path: '/recipes', icon: 'recipes' },
    { name: 'Meal Planner', path: '/meal-planner', icon: 'mealplanner' },
    { name: 'Meal Planning', path: '/meal-planning', icon: 'calendar' },
    { name: 'Unit Converter', path: '/unit-converter', icon: 'calculator' },
    { name: 'Usage Stats', path: '/stats', icon: 'stats' },
    { name: 'Achievements', path: '/gamification', icon: 'star' },
  ];
  
  return (
    <div 
      className={`fixed inset-0 z-50 bg-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}
    >
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-white mr-2">
            <Icon name="logo" className="text-white" size="lg" />
          </div>
          <h1 className="text-xl font-semibold font-poppins text-primary">PantryPal</h1>
        </div>
        <button 
          onClick={onClose}
          aria-label="Close menu"
        >
          <Icon name="close" size="xl" />
        </button>
      </div>
      
      <nav className="mt-2">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`mobile-nav-link ${location === item.path ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon name={item.icon as any} className="text-xl mr-3" />
            <span>{item.name}</span>
          </Link>
        ))}
        
        <Link 
          href="/settings" 
          className="mobile-nav-link"
          onClick={onClose}
        >
          <Icon name="settings" className="text-xl mr-3" />
          <span>Settings</span>
        </Link>
        
        <Link 
          href="/account-settings" 
          className="mobile-nav-link"
          onClick={onClose}
        >
          <Icon name="user" className="text-xl mr-3" />
          <span>Account & Family</span>
        </Link>
      </nav>
    </div>
  );
}
