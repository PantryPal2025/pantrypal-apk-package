import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({
        username: loginForm.username,
        password: loginForm.password,
      });
      
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      });
      
      toast({
        title: "Success",
        description: "Your account has been created and you're now logged in",
      });
      
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center text-white">
                <Icon name="logo" className="text-white" size="lg" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Welcome to PantryPal</CardTitle>
            <CardDescription>
              Your smart kitchen companion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="johndoe" 
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a 
                        href="#" 
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Password Reset",
                            description: "Password reset functionality is coming soon!",
                          });
                        }}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input 
                      id="register-username" 
                      placeholder="johndoe" 
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input 
                      id="register-confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-center flex-col space-y-4">
            <div className="text-center text-sm text-neutral-500">
              By continuing, you agree to PantryPal's <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Side - Hero Image/Content */}
      <div className="w-full md:w-1/2 bg-primary-light p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-lg text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Transform your kitchen experience
          </h1>
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-lg">
                <Icon name="inventory" className="text-white" size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Inventory Management</h3>
                <p className="opacity-80">Track your ingredients and get notified when items are about to expire.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-lg">
                <Icon name="recipes" className="text-white" size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Personalized Recipe Suggestions</h3>
                <p className="opacity-80">Get recipe ideas based on what's in your pantry to reduce food waste.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-lg">
                <Icon name="shopping" className="text-white" size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Integrated Shopping Lists</h3>
                <p className="opacity-80">Automatically generate shopping lists from recipes and low inventory items.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-lg">
                <Icon name="stats" className="text-white" size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Insightful Analytics</h3>
                <p className="opacity-80">Track your food usage patterns and see how you can reduce waste and save money.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}