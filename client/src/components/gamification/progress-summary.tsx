import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface UserPoints {
  userId: number;
  points: number;
  level: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  streak: number;
  lastActivity: string | null;
}

export function ProgressSummary() {
  const { user } = useAuth();
  
  // Fetch user points and level
  const { data: userPoints, isLoading } = useQuery<UserPoints>({
    queryKey: ['/api/gamification/points'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Achievements & Rewards</CardTitle>
          <CardDescription>Track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!userPoints) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Achievements & Rewards</CardTitle>
          <CardDescription>Track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-4">Sign in to track your achievements</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate progress to next level
  const calculateLevelProgress = () => {
    const currentPoints = userPoints.points - userPoints.currentLevelPoints;
    const pointsNeeded = userPoints.nextLevelPoints - userPoints.currentLevelPoints;
    return Math.min(100, Math.round((currentPoints / pointsNeeded) * 100));
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Achievements & Rewards</CardTitle>
        <CardDescription>Level {userPoints.level}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>{userPoints.points - userPoints.currentLevelPoints} points</span>
            <span>{userPoints.nextLevelPoints - userPoints.currentLevelPoints} points</span>
          </div>
          <Progress value={calculateLevelProgress()} className="h-2" />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-2">
              <Icon name="star" size="sm" />
            </div>
            <div>
              <p className="text-sm font-medium">{userPoints.points}</p>
              <p className="text-xs text-neutral-500">Total Points</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2">
              <Icon name="time" size="sm" />
            </div>
            <div>
              <p className="text-sm font-medium">{userPoints.streak} day{userPoints.streak !== 1 ? 's' : ''}</p>
              <p className="text-xs text-neutral-500">Current Streak</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}