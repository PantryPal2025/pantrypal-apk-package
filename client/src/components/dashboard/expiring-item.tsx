import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon';
import { format, differenceInDays, isTomorrow } from 'date-fns';

interface ExpiringItemProps {
  name: string;
  expirationDate: Date;
  icon: IconName;
}

export default function ExpiringItem({ name, expirationDate, icon }: ExpiringItemProps) {
  const daysUntilExpiration = differenceInDays(expirationDate, new Date());
  
  const getExpirationLabel = () => {
    if (isTomorrow(expirationDate)) return 'Tomorrow';
    if (daysUntilExpiration <= 0) return 'Today';
    return `${daysUntilExpiration} days`;
  };
  
  const getBadgeColor = () => {
    if (daysUntilExpiration <= 1) return 'bg-danger bg-opacity-10 text-danger';
    if (daysUntilExpiration <= 3) return 'bg-warning bg-opacity-10 text-warning';
    return 'bg-neutral-100 text-neutral-600';
  };
  
  const getIconColor = () => {
    if (daysUntilExpiration <= 1) return 'text-danger';
    if (daysUntilExpiration <= 3) return 'text-warning';
    return 'text-neutral-600';
  };
  
  const getIconBgColor = () => {
    if (daysUntilExpiration <= 1) return 'bg-danger bg-opacity-10';
    if (daysUntilExpiration <= 3) return 'bg-warning bg-opacity-10';
    return 'bg-neutral-100';
  };
  
  return (
    <li className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-lg ${getIconBgColor()} flex items-center justify-center mr-3`}>
          <Icon name={icon} className={getIconColor()} />
        </div>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-xs text-neutral-500">Expires in {getExpirationLabel()}</p>
        </div>
      </div>
      <span className={`text-xs font-medium ${getBadgeColor()} px-2 py-1 rounded-full`}>
        {getExpirationLabel()}
      </span>
    </li>
  );
}
