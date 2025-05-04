import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Account settings state
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('johndoe@example.com');
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [shoppingReminders, setShoppingReminders] = useState(true);
  
  // Premium plan state
  const [isPremium, setIsPremium] = useState(false);
  
  // Integration settings state
  const connectedServices = [
    { id: 'walmart', name: 'Walmart', icon: 'https://logo.clearbit.com/walmart.com', status: 'Connected' },
  ];
  
  const handleSaveAccount = () => {
    toast({
      title: 'Account settings saved',
      description: 'Your account information has been updated.',
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: 'Notification settings saved',
      description: 'Your notification preferences have been updated.',
    });
  };
  
  const handleDisconnectService = (serviceId: string) => {
    toast({
      title: 'Service disconnected',
      description: `${serviceId.charAt(0).toUpperCase() + serviceId.slice(1)} has been disconnected.`,
    });
  };
  
  const handleUpgradeToPremium = () => {
    // This would navigate to subscription page in a real implementation
    toast({
      title: 'Subscription required',
      description: 'Please subscribe to access premium features.',
    });
  };
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Settings</h1>
          <p className="text-neutral-600">Manage your account and application settings</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1 py-2">
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-neutral-100 ${activeTab === 'account' ? 'bg-neutral-100 font-medium text-primary' : 'text-neutral-600'}`}
                  onClick={() => setActiveTab('account')}
                >
                  <div className="flex items-center">
                    <Icon name="user" className="mr-2" size="sm" />
                    Account
                  </div>
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-neutral-100 ${activeTab === 'notifications' ? 'bg-neutral-100 font-medium text-primary' : 'text-neutral-600'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <div className="flex items-center">
                    <Icon name="bell" className="mr-2" size="sm" />
                    Notifications
                  </div>
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-neutral-100 ${activeTab === 'integrations' ? 'bg-neutral-100 font-medium text-primary' : 'text-neutral-600'}`}
                  onClick={() => setActiveTab('integrations')}
                >
                  <div className="flex items-center">
                    <Icon name="link" className="mr-2" size="sm" />
                    Integrations
                  </div>
                </button>
                <button
                  className={`w-full px-4 py-2 text-left hover:bg-neutral-100 ${activeTab === 'subscription' ? 'bg-neutral-100 font-medium text-primary' : 'text-neutral-600'}`}
                  onClick={() => setActiveTab('subscription')}
                >
                  <div className="flex items-center">
                    <Icon name="star" className="mr-2" size="sm" />
                    Premium
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="johndoe@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Change Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="New password" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="Confirm new password" 
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveAccount}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage how and when you receive alerts from PantryPal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-neutral-500">Receive notifications via email</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-neutral-500">Receive notifications on your device</p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="expiry-alerts">Expiry Alerts</Label>
                      <p className="text-sm text-neutral-500">Alerts for items nearing expiration</p>
                    </div>
                    <Switch 
                      id="expiry-alerts" 
                      checked={expiryAlerts}
                      onCheckedChange={setExpiryAlerts}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="shopping-reminders">Shopping Reminders</Label>
                      <p className="text-sm text-neutral-500">Reminders for items on your shopping list</p>
                    </div>
                    <Switch 
                      id="shopping-reminders" 
                      checked={shoppingReminders}
                      onCheckedChange={setShoppingReminders}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveNotifications}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Service Integrations</CardTitle>
                <CardDescription>
                  Manage your connections to grocery and delivery services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Connected Services</h3>
                  {connectedServices.map(service => (
                    <div 
                      key={service.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded overflow-hidden mr-3">
                          <img src={service.icon} alt={service.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-neutral-500">{service.status}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnectService(service.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
                  
                  <h3 className="text-base font-medium mt-6">Available Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Amazon Fresh', 'Instacart', 'Kroger', 'Target'].map(service => (
                      <div 
                        key={service} 
                        className="p-4 border rounded-lg"
                      >
                        <p className="font-medium">{service}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-2"
                        >
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Premium Subscription */}
          {activeTab === 'subscription' && (
            <Card>
              <CardHeader>
                <CardTitle>Premium Subscription</CardTitle>
                <CardDescription>
                  Upgrade to unlock premium features and enhance your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isPremium ? (
                  <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-gradient-to-r from-primary-light to-primary bg-opacity-10">
                      <h3 className="text-xl font-semibold text-primary">Upgrade to Premium</h3>
                      <p className="mt-2 text-neutral-600">Get access to exclusive features and enhanced functionality.</p>
                      
                      <div className="mt-6 space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                            <Icon name="check" className="text-primary relative z-10" size="sm" />
                          </div>
                          <p className="ml-3 text-sm text-neutral-600">AI-powered meal recommendations based on your ingredients</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                            <Icon name="check" className="text-primary relative z-10" size="sm" />
                          </div>
                          <p className="ml-3 text-sm text-neutral-600">Automatic shopping list generation from meal plans</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                            <Icon name="check" className="text-primary relative z-10" size="sm" />
                          </div>
                          <p className="ml-3 text-sm text-neutral-600">Unlimited recipe storage and organization</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                            <Icon name="check" className="text-primary relative z-10" size="sm" />
                          </div>
                          <p className="ml-3 text-sm text-neutral-600">Advanced analytics and waste reduction insights</p>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <div className="inline-flex items-baseline">
                          <span className="text-3xl font-semibold text-neutral-900">$5.99</span>
                          <span className="ml-1 text-neutral-600">/month</span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">or $59.99/year (save 17%)</p>
                        
                        <Button className="mt-4 w-full md:w-auto" onClick={handleUpgradeToPremium}>
                          Upgrade Now
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Questions about Premium?</h4>
                      <p className="text-sm text-neutral-600 mt-1">Visit our <a href="#" className="text-primary underline">FAQ</a> or <a href="#" className="text-primary underline">contact support</a> for more information.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-green-50">
                      <div className="flex items-center">
                        <Icon name="check" className="text-success mr-2" size="lg" />
                        <h3 className="text-xl font-semibold text-success">Premium Active</h3>
                      </div>
                      <p className="mt-2 text-neutral-600">You have access to all premium features. Your next billing date is May 1, 2025.</p>
                      
                      <div className="mt-6 grid gap-4">
                        <Button variant="outline">
                          Manage Subscription
                        </Button>
                        <Button variant="outline" className="text-red-500 hover:text-red-700">
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Need help with Premium features?</h4>
                      <p className="text-sm text-neutral-600 mt-1">Check out our <a href="#" className="text-primary underline">premium guide</a> or <a href="#" className="text-primary underline">contact support</a>.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}