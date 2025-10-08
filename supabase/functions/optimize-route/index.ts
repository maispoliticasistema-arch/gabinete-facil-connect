import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Stop {
  id: string;
  lat: number;
  lng: number;
  duration: number; // minutos
  address: string;
  eleitor_id?: string;
  demanda_id?: string;
  timeWindow?: { start: string; end: string }; // HH:MM format
  fixed?: boolean;
}

interface RouteRequest {
  origin: { lat: number; lng: number; address: string };
  startTime: string; // HH:MM
  startDate: string; // YYYY-MM-DD
  stops: Stop[];
  bufferTravel: number; // minutos
  bufferStop: number; // minutos
  returnLimit?: string; // HH:MM
  considerTraffic: boolean;
}

async function getRouteMatrix(points: Array<[number, number]>): Promise<number[][]> {
  try {
    const coords = points.map(p => `${p[0]},${p[1]}`).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.message}`);
    }
    
    // Converter segundos para minutos e adicionar buffer
    return data.durations.map((row: number[]) => 
      row.map((sec: number) => Math.ceil(sec / 60))
    );
  } catch (error) {
    console.error('Error getting route matrix:', error);
    // Fallback: usar distância euclidiana simples
    return points.map((p1) => 
      points.map((p2) => {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        return Math.ceil(dist * 100); // aproximação grosseira
      })
    );
  }
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addMinutesToDateTime(date: string, time: string, minutesToAdd: number): { date: string; time: string } {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, min] = time.split(':').map(Number);
  
  let totalMinutes = hour * 60 + min + minutesToAdd;
  let dayOffset = 0;
  
  while (totalMinutes >= 1440) { // 24h
    totalMinutes -= 1440;
    dayOffset++;
  }
  
  const newDate = new Date(year, month - 1, day + dayOffset);
  const newTime = formatTime(totalMinutes);
  
  return {
    date: `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${newDate.getDate().toString().padStart(2, '0')}`,
    time: newTime
  };
}

function optimizeRoute(
  matrix: number[][],
  stops: Stop[],
  bufferTravel: number,
  bufferStop: number
): { order: number[]; totalTime: number; conflicts: string[] } {
  const n = stops.length;
  const conflicts: string[] = [];
  
  // Separar paradas fixas e móveis
  const fixed = stops.map((s, i) => s.fixed ? i : -1).filter(i => i >= 0);
  const movable = stops.map((s, i) => !s.fixed ? i : -1).filter(i => i >= 0);
  
  // Se todas fixas, apenas retornar ordem original
  if (movable.length === 0) {
    return { order: stops.map((_, i) => i), totalTime: 0, conflicts };
  }
  
  // Nearest neighbor heuristic com time windows
  const order: number[] = [];
  const visited = new Set<number>();
  
  // Adicionar paradas fixas em suas posições
  fixed.forEach(idx => {
    visited.add(idx);
    order[idx] = idx;
  });
  
  // Começar da origem (índice 0)
  let current = 0;
  let currentTime = 0;
  
  while (visited.size < n) {
    let bestNext = -1;
    let bestCost = Infinity;
    let bestArrival = 0;
    
    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;
      
      // Verificar se próxima posição está ocupada por parada fixa
      const nextPos = order.length;
      if (fixed.includes(nextPos) && i !== nextPos) continue;
      
      const travelTime = matrix[current + 1][i + 1] + bufferTravel;
      const arrivalTime = currentTime + travelTime;
      
      const stop = stops[i];
      let feasible = true;
      let waitTime = 0;
      
      // Verificar time window
      if (stop.timeWindow) {
        const twStart = parseTime(stop.timeWindow.start);
        const twEnd = parseTime(stop.timeWindow.end);
        
        if (arrivalTime < twStart) {
          waitTime = twStart - arrivalTime;
        } else if (arrivalTime > twEnd) {
          feasible = false;
          conflicts.push(`Parada "${stop.address}" viola janela de tempo (chegada prevista: ${formatTime(arrivalTime)})`);
        }
      }
      
      if (feasible) {
        const cost = travelTime + waitTime;
        if (cost < bestCost) {
          bestCost = cost;
          bestNext = i;
          bestArrival = arrivalTime + waitTime;
        }
      }
    }
    
    if (bestNext === -1) {
      // Não encontrou parada viável, pegar a mais próxima mesmo violando
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const travelTime = matrix[current + 1][i + 1] + bufferTravel;
          if (travelTime < bestCost) {
            bestCost = travelTime;
            bestNext = i;
            bestArrival = currentTime + travelTime;
          }
        }
      }
    }
    
    visited.add(bestNext);
    order.push(bestNext);
    current = bestNext;
    currentTime = bestArrival + stops[bestNext].duration + bufferStop;
  }
  
  // Calcular tempo total
  let totalTime = 0;
  for (let i = 0; i < order.length; i++) {
    const from = i === 0 ? 0 : order[i - 1] + 1;
    const to = order[i] + 1;
    totalTime += matrix[from][to] + bufferTravel + stops[order[i]].duration + bufferStop;
  }
  
  return { order, totalTime, conflicts };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const routeRequest: RouteRequest = await req.json();
    console.log('Optimizing route for user:', user.id, 'with', routeRequest.stops.length, 'stops');

    // Construir matriz de pontos (origem + paradas)
    const points: Array<[number, number]> = [
      [routeRequest.origin.lng, routeRequest.origin.lat],
      ...routeRequest.stops.map(s => [s.lng, s.lat] as [number, number])
    ];

    // Obter matriz de tempos
    const matrix = await getRouteMatrix(points);

    // Otimizar rota
    const { order, totalTime, conflicts } = optimizeRoute(
      matrix,
      routeRequest.stops,
      routeRequest.bufferTravel,
      routeRequest.bufferStop
    );

    // Calcular ETAs para cada parada
    let currentDate = routeRequest.startDate;
    let currentTime = parseTime(routeRequest.startTime);
    
    const optimizedStops = order.map((stopIndex, i) => {
      const stop = routeRequest.stops[stopIndex];
      const prevIndex = i === 0 ? 0 : order[i - 1] + 1;
      const travelTime = matrix[prevIndex][stopIndex + 1] + routeRequest.bufferTravel;
      
      // Calcular chegada
      const arrival = addMinutesToDateTime(currentDate, formatTime(currentTime), travelTime);
      let startTime = arrival.time;
      let startDate = arrival.date;
      
      // Verificar time window
      let conflictWindow = false;
      if (stop.timeWindow) {
        const arrivalMinutes = parseTime(arrival.time);
        const twStart = parseTime(stop.timeWindow.start);
        const twEnd = parseTime(stop.timeWindow.end);
        
        if (arrivalMinutes < twStart) {
          // Esperar até janela abrir
          startTime = stop.timeWindow.start;
        } else if (arrivalMinutes > twEnd) {
          conflictWindow = true;
        }
      }
      
      const startMinutes = parseTime(startTime);
      const endDateTime = addMinutesToDateTime(startDate, startTime, stop.duration + routeRequest.bufferStop);
      
      // Atualizar tempo atual
      currentDate = endDateTime.date;
      currentTime = parseTime(endDateTime.time);
      
      return {
        ...stop,
        order: i + 1,
        travelTimeMinutes: travelTime,
        etaArrival: `${arrival.date}T${arrival.time}:00`,
        etaStart: `${startDate}T${startTime}:00`,
        etaEnd: `${endDateTime.date}T${endDateTime.time}:00`,
        conflictWindow,
        delayMinutes: conflictWindow ? parseTime(arrival.time) - parseTime(stop.timeWindow!.end) : 0
      };
    });

    // Verificar limite de retorno
    let returnConflict = false;
    if (routeRequest.returnLimit) {
      const finalTime = parseTime(optimizedStops[optimizedStops.length - 1].etaEnd.split('T')[1]);
      const limitTime = parseTime(routeRequest.returnLimit);
      if (finalTime > limitTime) {
        returnConflict = true;
        conflicts.push(`Horário de término (${formatTime(finalTime)}) ultrapassa limite de retorno (${routeRequest.returnLimit})`);
      }
    }

    // Calcular distância total
    let totalDistance = 0;
    for (let i = 0; i < optimizedStops.length; i++) {
      totalDistance += optimizedStops[i].travelTimeMinutes;
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizedStops,
        totalTime,
        totalDistance: Math.round(totalDistance * 1.2), // aproximação km
        conflicts,
        returnConflict,
        summary: {
          totalStops: optimizedStops.length,
          totalDuration: Math.round(totalTime / 60 * 10) / 10,
          startTime: routeRequest.startTime,
          endTime: optimizedStops[optimizedStops.length - 1]?.etaEnd?.split('T')[1] || routeRequest.startTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error optimizing route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});