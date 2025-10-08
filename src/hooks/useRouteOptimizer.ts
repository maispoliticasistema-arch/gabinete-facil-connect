import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Stop {
  id: string;
  lat: number;
  lng: number;
  duration: number;
  address: string;
  eleitor_id?: string;
  demanda_id?: string;
  timeWindow?: { start: string; end: string };
  fixed?: boolean;
}

interface RouteOptimizationRequest {
  origin: { lat: number; lng: number; address: string };
  startTime: string;
  startDate: string;
  stops: Stop[];
  bufferTravel?: number;
  bufferStop?: number;
  returnLimit?: string;
  considerTraffic?: boolean;
}

interface OptimizedStop extends Stop {
  order: number;
  travelTimeMinutes: number;
  etaArrival: string;
  etaStart: string;
  etaEnd: string;
  conflictWindow?: boolean;
  delayMinutes?: number;
}

interface OptimizationResult {
  success: boolean;
  optimizedStops: OptimizedStop[];
  totalTime: number;
  totalDistance: number;
  conflicts: string[];
  returnConflict: boolean;
  summary: {
    totalStops: number;
    totalDuration: number;
    startTime: string;
    endTime: string;
  };
}

export const useRouteOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  const optimizeRoute = async (request: RouteOptimizationRequest) => {
    setIsOptimizing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          ...request,
          bufferTravel: request.bufferTravel || 10,
          bufferStop: request.bufferStop || 5,
          considerTraffic: request.considerTraffic !== false
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao otimizar roteiro');
      }

      setOptimizationResult(data);

      // Mostrar avisos se houver conflitos
      if (data.conflicts && data.conflicts.length > 0) {
        toast.warning('Conflitos detectados', {
          description: `${data.conflicts.length} conflito(s) encontrado(s). Verifique os detalhes.`
        });
      } else {
        toast.success('Roteiro otimizado!', {
          description: `${data.summary.totalStops} paradas organizadas. Duração: ${data.summary.totalDuration}h`
        });
      }

      return data;
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Erro ao otimizar roteiro', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearOptimization = () => {
    setOptimizationResult(null);
  };

  return {
    optimizeRoute,
    isOptimizing,
    optimizationResult,
    clearOptimization
  };
};