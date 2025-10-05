import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}
export const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick
}: StatsCardProps) => {
  return <Card className={`shadow-card transition-smooth hover:shadow-card-hover ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>}
            {trend && (
              <p className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>;
};