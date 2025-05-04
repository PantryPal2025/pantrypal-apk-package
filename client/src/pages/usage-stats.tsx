import { useQuery } from '@tanstack/react-query';
import { FoodWasteStat, InventoryItem } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function UsageStats() {
  // Fetch all inventory items for usage patterns
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });
  
  // Fetch food waste stats
  const { data: wasteStats = [] } = useQuery<FoodWasteStat[]>({
    queryKey: ['/api/stats/waste'],
  });
  
  // This is demo data - in a real app, we would process the actual backend data
  // to generate these statistics
  
  // Consumption by category
  const categoryConsumption = [
    { name: 'Produce', value: 35 },
    { name: 'Dairy', value: 20 },
    { name: 'Meat', value: 15 },
    { name: 'Grains', value: 10 },
    { name: 'Bakery', value: 10 },
    { name: 'Other', value: 10 },
  ];
  
  // Food waste by reason
  const wasteByReason = [
    { name: 'Expired', value: 45 },
    { name: 'Spoiled', value: 30 },
    { name: 'Leftover', value: 15 },
    { name: 'Overcooked', value: 10 },
  ];
  
  // Monthly tracking data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, 'MMM'),
      purchased: Math.floor(Math.random() * 20) + 20,
      wasted: Math.floor(Math.random() * 8) + 2,
    };
  }).reverse();
  
  // Financial impact
  const financialData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, 'MMM'),
      saved: Math.floor(Math.random() * 30) + 15,
      spent: Math.floor(Math.random() * 70) + 100,
    };
  }).reverse();
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Colors for charts
  const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#607D8B'];
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Usage Statistics</h1>
          <p className="text-neutral-600">Track your kitchen efficiency and reduce waste</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <NavDropdown 
            trigger={
              <button className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
                <span className="text-sm mr-1">Pages</span>
                <Icon name="menu" size="sm" />
              </button>
            }
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Food Items</CardTitle>
            <CardDescription>Monthly tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventoryItems.length}</div>
            <p className="text-xs text-neutral-500 mt-1">currently in your inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Waste Reduction</CardTitle>
            <CardDescription>vs. last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">12%</div>
            <p className="text-xs text-neutral-500 mt-1">improvement in waste reduction</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Money Saved</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$45.20</div>
            <p className="text-xs text-neutral-500 mt-1">by reducing food waste</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expiry Tracking</CardTitle>
            <CardDescription>Effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">92%</div>
            <p className="text-xs text-neutral-500 mt-1">of items used before expiry</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Consumption Patterns</CardTitle>
            <CardDescription>
              Analysis of your cooking and eating habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="categories">
              <TabsList className="mb-4">
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="tracking">Monthly Tracking</TabsTrigger>
              </TabsList>
              
              <TabsContent value="categories" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryConsumption}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryConsumption.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="tracking" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="purchased" name="Items Purchased" fill="#4CAF50" />
                    <Bar dataKey="wasted" name="Items Wasted" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Food Waste Analysis</CardTitle>
            <CardDescription>
              Identify patterns to reduce future waste
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="reasons">
              <TabsList className="mb-4">
                <TabsTrigger value="reasons">Waste Reasons</TabsTrigger>
                <TabsTrigger value="financial">Financial Impact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reasons" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteByReason}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {wasteByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="financial" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="saved" name="Money Saved ($)" fill="#4CAF50" />
                    <Bar dataKey="spent" name="Grocery Spending ($)" fill="#2196F3" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Waste Reduction Tips</CardTitle>
          <CardDescription>
            Based on your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-primary">Meal Planning</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Your data shows that proper meal planning could reduce your food waste by up to 30%. 
                Try planning meals for the entire week to make the most of your ingredients.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Use the meal planner feature to organize your week
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Create meal plans that reuse ingredients
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-secondary">Storage</h3>
              <p className="text-sm text-neutral-600 mb-3">
                15% of your food waste comes from improper storage. 
                Store vegetables and fruits correctly to extend their shelf life.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  Store leafy greens with a paper towel to absorb moisture
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  Keep onions and potatoes in a cool, dark place
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-info">Shopping Smart</h3>
              <p className="text-sm text-neutral-600 mb-3">
                You often buy more produce than you use. Consider buying smaller quantities more frequently.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-info mr-2">•</span>
                  Always shop with a list based on your meal plan
                </li>
                <li className="flex items-start">
                  <span className="text-info mr-2">•</span>
                  Check inventory before shopping to avoid duplicates
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
