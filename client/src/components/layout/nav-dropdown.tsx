import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';

interface NavDropdownProps {
  trigger?: React.ReactNode;
}

export default function NavDropdown({ trigger }: NavDropdownProps) {
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
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Account & Family', path: '/account-settings', icon: 'user' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
            <span className="text-sm mr-1">Menu</span>
            <Icon name="menu" size="sm" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {NAV_ITEMS.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link href={item.path} className="flex items-center cursor-pointer">
              <Icon name={item.icon as any} className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}