import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import PageLayout from "@/components/layout/page-layout";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import ShoppingList from "@/pages/shopping-list";
import Recipes from "@/pages/recipes";
import RecipeDetail from "@/pages/recipe-detail";
import MealPlanner from "@/pages/meal-planner";
import MealPlanning from "@/pages/meal-planning";
import UnitConverter from "@/pages/unit-converter";
import UsageStats from "@/pages/usage-stats";
import Settings from "@/pages/settings";
import AccountSettings from "@/pages/account-settings";
import Gamification from "@/pages/gamification";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { AchievementToast } from "@/components/gamification/achievement-toast";
import { useDeepLinks } from "@/utils/deep-linking";

function Router() {
  // Initialize deep linking (will only work on native platforms)
  useDeepLinks();
  
  return (
    <PageLayout>
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/inventory" component={Inventory} />
        <ProtectedRoute path="/shopping" component={ShoppingList} />
        <ProtectedRoute path="/recipes" component={Recipes} />
        <ProtectedRoute path="/recipes/:id" component={RecipeDetail} />
        <ProtectedRoute path="/meal-planner" component={MealPlanner} />
        <ProtectedRoute path="/meal-planning" component={MealPlanning} />
        <ProtectedRoute path="/unit-converter" component={UnitConverter} />
        <ProtectedRoute path="/stats" component={UsageStats} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/account-settings" component={AccountSettings} />
        <ProtectedRoute path="/gamification" component={Gamification} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </PageLayout>
  );
}

function App() {
  // Initialize Capacitor native features on startup
  useEffect(() => {
    // Import and run initialization dynamically to prevent issues during SSR
    import('./utils/initialize-app').then(({ initializeApp }) => {
      initializeApp();
    }).catch(error => {
      console.error('Failed to initialize app:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AchievementToast />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
