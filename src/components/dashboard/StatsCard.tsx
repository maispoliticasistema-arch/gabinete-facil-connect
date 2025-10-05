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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>;
};