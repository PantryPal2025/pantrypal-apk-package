import { Link, useLocation } from 'wouter';
import { Icon } from '@/components/ui/icon';

export default function Sidebar() {
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
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-neutral-200">
      <div className="p-4 flex items-center border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-white mr-2">
          <Icon name="logo" className="text-white" size="lg" />
        </div>
        <h1 className="text-xl font-semibold font-poppins text-primary">PantryPal</h1>
      </div>
      
      <nav className="flex-1 pt-2">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`sidebar-nav-link ${location === item.path ? 'active' : ''}`}
          >
            <Icon name={item.icon as any} className="text-xl mr-3" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-neutral-200 space-y-3">
        <Link href="/settings" className="flex items-center text-neutral-600 hover:text-neutral-800">
          <Icon name="settings" className="text-xl mr-3" />
          <span>Settings</span>
        </Link>
        <Link href="/account-settings" className="flex items-center text-neutral-600 hover:text-neutral-800">
          <Icon name="user" className="text-xl mr-3" />
          <span>Account & Family</span>
        </Link>
      </div>
    </aside>
  );
}
