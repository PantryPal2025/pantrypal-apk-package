import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Mock service data
const groceryServices = [
  { 
    id: 'walmart', 
    name: 'Walmart', 
    icon: 'https://logo.clearbit.com/walmart.com', 
    description: 'Import items from your Walmart cart or order history',
    connected: false,
    available: true
  },
  { 
    id: 'kroger', 
    name: 'Kroger', 
    icon: 'https://logo.clearbit.com/kroger.com', 
    description: 'Connect with your Kroger account to import items',
    connected: false,
    available: true
  },
  { 
    id: 'amazon-fresh', 
    name: 'Amazon Fresh', 
    icon: 'https://logo.clearbit.com/amazon.com', 
    description: 'Sync with Amazon Fresh for grocery shopping',
    connected: false,
    available: true
  },
  { 
    id: 'target', 
    name: 'Target', 
    icon: 'https://logo.clearbit.com/target.com', 
    description: 'Import from Target grocery orders',
    connected: false,
    available: false,
    comingSoon: true
  }
];

export default function GroceryServiceIntegration() {
  const { toast } = useToast();
  const [services, setServices] = useState(groceryServices);
  const [activeTab, setActiveTab] = useState('connect');
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleConnect = (serviceId: string) => {
    setLoading(serviceId);
    
    // Simulate API connection
    setTimeout(() => {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, connected: true } 
          : service
      ));
      setLoading(null);
      
      toast({
        title: "Connection Successful",
        description: `You have successfully connected to ${services.find(s => s.id === serviceId)?.name}`,
      });
      
      setActiveTab('settings');
    }, 1500);
  };
  
  const handleDisconnect = (serviceId: string) => {
    setLoading(serviceId);
    
    // Simulate API disconnection
    setTimeout(() => {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, connected: false } 
          : service
      ));
      setLoading(null);
      
      toast({
        title: "Disconnected",
        description: `You have disconnected from ${services.find(s => s.id === serviceId)?.name}`,
      });
    }, 1000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grocery Service Integrations</CardTitle>
        <CardDescription>
          Connect to your favorite grocery stores to streamline shopping lists and inventory management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect">Connect Services</TabsTrigger>
            <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connect" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {services.map(service => (
                <Card key={service.id} className={service.comingSoon ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-100">
                          {service.icon ? (
                            <img src={service.icon} alt={service.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <Icon name="shopping" className="text-neutral-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-neutral-500">{service.description}</p>
                          {service.connected && (
                            <span className="inline-flex items-center text-xs text-green-600 mt-1">
                              <Icon name="checkCircle" size="xs" className="mr-1" />
                              Connected
                            </span>
                          )}
                          {service.comingSoon && (
                            <span className="inline-flex items-center text-xs text-amber-600 mt-1">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!service.comingSoon && (
                        <Button 
                          variant={service.connected ? "outline" : "default"}
                          onClick={() => service.connected ? handleDisconnect(service.id) : handleConnect(service.id)}
                          disabled={loading === service.id}
                        >
                          {loading === service.id ? (
                            <span className="flex items-center">
                              <Icon name="refresh" className="mr-2 animate-spin" size="sm" />
                              {service.connected ? 'Disconnecting...' : 'Connecting...'}
                            </span>
                          ) : (
                            service.connected ? 'Disconnect' : 'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 mt-4">
            {services.some(s => s.connected) ? (
              <>
                <h3 className="text-base font-medium mb-2">Connected Services</h3>
                {services.filter(s => s.connected).map(service => (
                  <Card key={service.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 mr-2">
                            <img src={service.icon} alt={service.name} className="h-full w-full object-contain" />
                          </div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnect(service.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`autosync-${service.id}`} className="flex-1">
                            <span>Auto-sync shopping lists</span>
                            <p className="text-xs text-neutral-500">Automatically add PantryPal items to your {service.name} cart</p>
                          </Label>
                          <Switch id={`autosync-${service.id}`} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`autoimport-${service.id}`} className="flex-1">
                            <span>Import purchases to inventory</span>
                            <p className="text-xs text-neutral-500">Automatically add purchased items to your inventory</p>
                          </Label>
                          <Switch id={`autoimport-${service.id}`} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`notifications-${service.id}`} className="flex-1">
                            <span>Notifications</span>
                            <p className="text-xs text-neutral-500">Receive notifications about price drops and deals</p>
                          </Label>
                          <Switch id={`notifications-${service.id}`} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Sync Started",
                            description: `Synchronizing data with ${service.name}...`,
                          });
                        }}
                      >
                        <Icon name="refresh" size="sm" className="mr-2" />
                        Sync Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                <div className="pt-4">
                  <h3 className="text-base font-medium mb-2">API Key Management</h3>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key (for developer use)</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="api-key" 
                        type="password" 
                        value="••••••••••••••••••••••••••••••" 
                        readOnly 
                      />
                      <Button 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText("mock-api-key-12345");
                          toast({
                            title: "API Key Copied",
                            description: "The API key has been copied to your clipboard.",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500">
                      This API key allows developers to access grocery service data. Keep it secure.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <Icon name="shopping" size="2xl" className="text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Connected Services</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  Connect to grocery services to enable automatic syncing of shopping lists and inventory management.
                </p>
                <Button onClick={() => setActiveTab('connect')}>
                  Connect a Service
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}