import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, CheckCircle2, Route } from 'lucide-react';

interface RoteirosStatsProps {
  totalRoteiros: number;
  emAndamento: number;
  locaisVisitados: number;
  distanciaTotal: number;
}

export const RoteirosStats = ({
  totalRoteiros,
  emAndamento,
  locaisVisitados,
  distanciaTotal
}: RoteirosStatsProps) => {
  const stats = [
    {
      label: 'Roteiros Este Mês',
      value: totalRoteiros,
      icon: Route,
      color: 'text-primary'
    },
    {
      label: 'Em Andamento Hoje',
      value: emAndamento,
      icon: Navigation,
      color: 'text-chart-2'
    },
    {
      label: 'Locais Visitados',
      value: locaisVisitados,
      icon: CheckCircle2,
      color: 'text-chart-4'
    },
    {
      label: 'Km Total',
      value: typeof distanciaTotal === 'number' && !isNaN(distanciaTotal) ? `${distanciaTotal.toFixed(1)} km` : '0.0 km',
      icon: MapPin,
      color: 'text-chart-3'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};