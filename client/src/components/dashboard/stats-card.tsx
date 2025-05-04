import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconName;
  iconColor: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export default function StatsCard({ title, value, icon, iconColor, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-neutral-600 text-sm font-medium">{title}</h3>
        <Icon name={icon} className={`text-${iconColor} text-xl`} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      
      {trend && (
        <div className="mt-2 text-xs text-neutral-500">
          <span className={`text-${trend.positive ? 'success' : 'danger'} flex items-center`}>
            <Icon name="upArrow" className="mr-1" size="xs" />
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
