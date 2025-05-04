import { Link, useLocation } from 'wouter';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';

export default function MainMenu() {
  const [location] = useLocation();
  
  const MENU_ITEMS = [
    { name: 'Inventory', path: '/inventory', icon: 'inventory', description: 'Track your food items' },
    { name: 'Shopping List', path: '/shopping', icon: 'shopping', description: 'Plan your grocery shopping' },
    { name: 'Recipes', path: '/recipes', icon: 'recipes', description: 'Find and create recipes' },
    { name: 'Meal Planner', path: '/meal-planner', icon: 'mealplanner', description: 'Schedule your meals' },
    { name: 'Meal Planning', path: '/meal-planning', icon: 'calendar', description: 'Plan meals and track nutrition' },
    { name: 'Usage Stats', path: '/stats', icon: 'stats', description: 'Track food waste and savings' },
    { name: 'Settings', path: '/settings', icon: 'settings', description: 'Customize your experience' },
  ];

  return (
    <div className="mt-4 mb-8">
      <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {MENU_ITEMS.map((item) => (
          <Link key={item.path} href={item.path}>
            <Card className={`cursor-pointer transition-all hover:border-primary-light shadow-sm hover:shadow ${location === item.path ? 'border-primary-light bg-primary-lightest' : ''}`}>
              <CardContent className="p-4 flex items-center">
                <div className={`flex items-center justify-center h-12 w-12 rounded-full ${location === item.path ? 'bg-primary-light text-white' : 'bg-neutral-100'}`}>
                  <Icon name={item.icon as any} size="lg" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-lg">{item.name}</h3>
                  <p className="text-neutral-600 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}