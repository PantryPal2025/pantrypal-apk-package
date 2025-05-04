import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
import NavDropdown from '@/components/layout/nav-dropdown';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

// Types
interface UserPoints {
  userId: number;
  points: number;
  level: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  streak: number;
  lastActivity: string | null;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requiredProgress: number;
  reward: number;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  achievement: Achievement;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  requiredProgress: number;
  reward: number;
  expiresAt: string | null;
}

interface UserChallenge {
  id: number;
  userId: number;
  challengeId: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  challenge: Challenge;
}

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('achievements');
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/auth');
    return null;
  }
  
  // Fetch user points and level
  const { data: userPoints, isLoading: isLoadingPoints } = useQuery<UserPoints>({
    queryKey: ['/api/gamification/points'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Fetch user achievements
  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery<UserAchievement[]>({
    queryKey: ['/api/gamification/achievements'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Fetch user challenges
  const { data: challenges = [], isLoading: isLoadingChallenges } = useQuery<UserChallenge[]>({
    queryKey: ['/api/gamification/challenges'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Filter achievements by category (with safety checks)
  const inventoryAchievements = achievements.filter(a => a.achievement && a.achievement.category === 'inventory');
  const wasteAchievements = achievements.filter(a => a.achievement && a.achievement.category === 'waste');
  const streakAchievements = achievements.filter(a => a.achievement && a.achievement.category === 'streak');
  const scanningAchievements = achievements.filter(a => a.achievement && a.achievement.category === 'scanning');
  
  // Sort challenges by completion and expiry (with proper type checking)
  const activeChallenges = Array.isArray(challenges) 
    ? challenges.filter(c => c && !c.completed) 
    : [];
  const completedChallenges = Array.isArray(challenges)
    ? challenges.filter(c => c && c.completed)
    : [];

  // Calculate progress to next level
  const calculateLevelProgress = () => {
    if (!userPoints) return 0;
    const currentPoints = userPoints.points - userPoints.currentLevelPoints;
    const pointsNeeded = userPoints.nextLevelPoints - userPoints.currentLevelPoints;
    return Math.min(100, Math.round((currentPoints / pointsNeeded) * 100));
  };
  
  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Achievements & Rewards</h1>
          <p className="text-neutral-600">Track your progress and unlock rewards</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <NavDropdown 
            trigger={
              <button className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-200 rounded-lg">
                <span className="text-sm mr-1">Menu</span>
                <Icon name="menu" size="sm" />
              </button>
            }
          />
        </div>
      </div>
      
      {/* User Level & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow">
          <CardContent className="p-6">
            {isLoadingPoints ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !userPoints ? (
              <div className="text-center py-4">
                <p>Sign in to track your kitchen achievements!</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-2xl font-bold mb-4 sm:mb-0 sm:mr-6">
                    {userPoints.level}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Level {userPoints.level}</h2>
                    <p className="text-sm text-neutral-600">
                      {userPoints.points - userPoints.currentLevelPoints} / {userPoints.nextLevelPoints - userPoints.currentLevelPoints} points to Level {userPoints.level + 1}
                    </p>
                    <div className="mt-2 w-full sm:max-w-md">
                      <Progress value={calculateLevelProgress()} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">
                      <Icon name="star" size="sm" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Total Points</p>
                      <p className="text-lg font-medium">{userPoints.points}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                      <Icon name="time" size="sm" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Current Streak</p>
                      <p className="text-lg font-medium">{userPoints.streak} day{userPoints.streak !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 flex items-center col-span-2 md:col-span-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      <Icon name="check" size="sm" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Achievements</p>
                      <p className="text-lg font-medium">
                        {achievements.filter(a => a.completed).length} / {achievements.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow">
          <CardHeader className="pb-0">
            <CardTitle>Current Challenge</CardTitle>
            <CardDescription>Complete for bonus points</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingChallenges ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activeChallenges.length === 0 ? (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  No active challenges. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeChallenges.slice(0, 1).map(challenge => (
                  <div key={challenge.id} className="bg-muted p-4 rounded-lg">
                    {challenge.challenge ? (
                      <>
                        <h4 className="font-medium mb-1">{challenge.challenge.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{challenge.challenge.description}</p>
                        
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            Progress: {challenge.progress} / {challenge.challenge.requiredProgress}
                          </span>
                          <span className="text-xs font-medium text-green-600">+{challenge.challenge.reward} pts</span>
                        </div>
                        
                        <Progress 
                          value={(challenge.progress / challenge.challenge.requiredProgress) * 100} 
                          className="h-2" 
                        />
                        
                        {challenge.challenge.expiresAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expires: {format(new Date(challenge.challenge.expiresAt), 'MMM d, yyyy')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Challenge details unavailable</p>
                    )}
                  </div>
                ))}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="#challenges" onClick={() => setActiveTab('challenges')}>
                    View All Challenges
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Achievement Tabs */}
      <Tabs defaultValue="achievements" value={activeTab} onValueChange={setActiveTab} className="w-full bg-white rounded-lg shadow p-4">
        <TabsList className="mb-4 grid grid-cols-2 bg-muted">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Inventory Master</h3>
            
            {isLoadingAchievements ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : inventoryAchievements.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No inventory achievements available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Waste Warrior</h3>
            
            {isLoadingAchievements ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : wasteAchievements.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No waste reduction achievements available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wasteAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Streak Champion</h3>
            
            {isLoadingAchievements ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : streakAchievements.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No streak achievements available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streakAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Scanning Pro</h3>
            
            {isLoadingAchievements ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : scanningAchievements.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No scanning achievements available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanningAchievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="challenges" id="challenges" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Challenges</h3>
            
            {isLoadingChallenges ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activeChallenges.length === 0 ? (
              <p className="text-neutral-500 text-center p-4 bg-muted rounded-md">No active challenges at the moment. Check back later!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-4">Completed Challenges</h3>
            
            {isLoadingChallenges ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : completedChallenges.length === 0 ? (
              <p className="text-neutral-500 text-center p-4 bg-muted rounded-md">No completed challenges yet. Complete an active challenge to see it here!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Achievement Card Component
function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  const { progress, completed } = achievement;
  const achievementDetails = achievement.achievement || {
    name: 'Unknown Achievement',
    description: 'Details unavailable',
    requiredProgress: 1,
    reward: 0
  };
  const progressPercent = Math.min(100, Math.round((progress / (achievementDetails.requiredProgress || 1)) * 100));
  
  return (
    <Card className={`border ${completed ? 'border-amber-200 bg-amber-50' : 'border-neutral-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className={`w-12 h-12 rounded-full ${
            completed 
              ? 'bg-gradient-to-br from-amber-400 to-yellow-600' 
              : 'bg-neutral-100'
          } flex items-center justify-center mr-3 mt-1`}>
            <Icon 
              name="star" 
              className={completed ? 'text-white' : 'text-neutral-400'} 
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{achievementDetails.name}</h4>
            <p className="text-sm text-neutral-600 mt-1">{achievementDetails.description}</p>
            
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">
                  {completed ? 'Completed!' : `${progress} / ${achievementDetails.requiredProgress}`}
                </span>
                <span className="text-xs font-medium text-green-600">+{achievementDetails.reward} pts</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Challenge Card Component
function ChallengeCard({ challenge }: { challenge: UserChallenge }) {
  const { progress, completed } = challenge;
  const challengeDetails = challenge.challenge || {
    title: 'Unknown Challenge',
    description: 'Details unavailable',
    requiredProgress: 1,
    reward: 0,
    expiresAt: null
  };
  const progressPercent = Math.min(100, Math.round((progress / (challengeDetails.requiredProgress || 1)) * 100));
  
  return (
    <Card className={`border ${completed ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200'}`}>
      <CardContent className="p-4">
        <div>
          <h4 className="font-medium">{challengeDetails.title}</h4>
          <p className="text-sm text-neutral-600 mt-1">{challengeDetails.description}</p>
          
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500">
                {completed ? 'Completed!' : `${progress} / ${challengeDetails.requiredProgress}`}
              </span>
              <span className="text-xs font-medium text-green-600">+{challengeDetails.reward} pts</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
          
          {!completed && challengeDetails.expiresAt && (
            <p className="text-xs text-neutral-500 mt-2">
              Expires: {format(new Date(challengeDetails.expiresAt), 'MMM d, yyyy')}
            </p>
          )}
          
          {completed && challenge.completedAt && (
            <p className="text-xs text-neutral-500 mt-2">
              Completed on: {format(new Date(challenge.completedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}