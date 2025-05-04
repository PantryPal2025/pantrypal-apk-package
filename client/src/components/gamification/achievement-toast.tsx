import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@/components/ui/icon';
import confetti from 'canvas-confetti';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
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

export function AchievementToast() {
  const { toast } = useToast();
  
  // Fetch user achievements
  const { data: achievements } = useQuery<UserAchievement[]>({
    queryKey: ['/api/gamification/achievements'],
    refetchInterval: 10000, // Check every 10 seconds for new achievements
  });

  // Show toast for newly completed achievements
  useEffect(() => {
    if (!achievements) return;
    
    // Find newly completed achievements (completed but not yet shown)
    const newlyCompleted = achievements.filter(
      (a) => a.completed && a.completedAt && isRecent(a.completedAt)
    );
    
    if (newlyCompleted.length > 0) {
      // Trigger confetti animation
      triggerConfetti();
      
      // Show toast for each achievement with a slight delay between them
      newlyCompleted.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementToast(achievement);
        }, index * 1500); // 1.5 second delay between toasts
      });
    }
  }, [achievements, toast]);

  // Check if date is within the last minute (to avoid showing old achievements on page refresh)
  const isRecent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = diffMs / 1000;
    return diffSec < 60; // Within the last minute
  };

  // Show achievement toast
  const showAchievementToast = (userAchievement: UserAchievement) => {
    const { achievement } = userAchievement;
    
    toast({
      title: "Achievement Unlocked!",
      description: (
        <div className="mt-1">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white mr-2">
              <Icon name="star" size="sm" />
            </div>
            <p className="font-semibold">{achievement.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
          <p className="text-sm font-medium text-green-600 mt-1">+{achievement.reward} points</p>
        </div>
      ),
      duration: 6000, // Show for 6 seconds
    });
  };

  // Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.5) }
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.5) }
      });
    }, 250);
  };

  return null; // This component doesn't render anything
}