import React from 'react';
import { Clock, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineStop {
  id: string;
  order: number;
  address: string;
  duration: number;
  etaArrival: string;
  etaStart: string;
  etaEnd: string;
  travelTimeMinutes: number;
  conflictWindow?: boolean;
  delayMinutes?: number;
  eleitor_id?: string;
  visitado?: boolean;
}

interface RouteTimelineProps {
  startTime: string;
  startAddress: string;
  stops: TimelineStop[];
  totalDistance?: number;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  startTime,
  startAddress,
  stops,
  totalDistance
}) => {
  const formatTimeOnly = (datetime: string) => {
    try {
      return format(new Date(datetime), 'HH:mm', { locale: ptBR });
    } catch {
      return datetime.split('T')[1]?.slice(0, 5) || '--:--';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Saída</p>
              <p className="text-lg font-bold">{startTime}</p>
            </div>
          </div>
          {stops.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">Retorno previsto</p>
                <p className="text-lg font-bold">{formatTimeOnly(stops[stops.length - 1].etaEnd)}</p>
              </div>
              <Clock className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        {totalDistance && (
          <p className="text-sm text-muted-foreground mt-2">
            Distância total estimada: ~{totalDistance} km
          </p>
        )}
      </Card>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Origem */}
        <div className="relative pb-8">
          <div className="absolute left-[-1.5rem] top-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="absolute left-[-1rem] top-8 bottom-0 w-0.5 bg-border" />
          <Card className="p-4">
            <p className="font-semibold">{startAddress}</p>
            <p className="text-sm text-muted-foreground">Ponto de partida • {startTime}</p>
          </Card>
        </div>

        {/* Paradas */}
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          const hasConflict = stop.conflictWindow;
          const isCompleted = stop.visitado;

          return (
            <div key={stop.id} className="relative pb-8">
              <div className={`absolute left-[-1.5rem] top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                hasConflict ? 'bg-destructive' : isCompleted ? 'bg-success' : 'bg-muted'
              }`}>
                <span className={`text-sm font-bold ${
                  hasConflict ? 'text-destructive-foreground' : isCompleted ? 'text-success-foreground' : 'text-muted-foreground'
                }`}>
                  {stop.order}
                </span>
              </div>
              {!isLast && (
                <div className="absolute left-[-1rem] top-8 bottom-0 w-0.5 bg-border" />
              )}
              
              <Card className={`p-4 ${hasConflict ? 'border-destructive' : isCompleted ? 'border-success' : ''}`}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold">{stop.address}</p>
                      {hasConflict && (
                        <Badge variant="destructive" className="mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Conflito de horário (+{stop.delayMinutes} min)
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="mt-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Visitado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Chegada</p>
                      <p className="font-medium">{formatTimeOnly(stop.etaArrival)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Início</p>
                      <p className="font-medium">{formatTimeOnly(stop.etaStart)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Término</p>
                      <p className="font-medium">{formatTimeOnly(stop.etaEnd)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>🚗 {stop.travelTimeMinutes} min deslocamento</span>
                    <span>⏱️ {stop.duration} min duração</span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};