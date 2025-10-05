import { supabase } from "@/integrations/supabase/client";

type MetricType = 'api_request' | 'db_query' | 'page_load' | 'error_rate';

interface TrackMetricParams {
  type: MetricType;
  endpoint?: string;
  durationMs: number;
  statusCode?: number;
  gabineteId?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra métricas de performance para monitoramento
 */
export async function trackPerformanceMetric({
  type,
  endpoint,
  durationMs,
  statusCode,
  gabineteId,
  metadata
}: TrackMetricParams) {
  try {
    await supabase
      .from('performance_metrics')
      .insert({
        metric_type: type,
        endpoint,
        duration_ms: durationMs,
        status_code: statusCode,
        gabinete_id: gabineteId || null,
        metadata: metadata || null
      });
  } catch (error) {
    // Não queremos que o tracking de métricas cause problemas
    console.error('Erro ao registrar métrica:', error);
  }
}

/**
 * Registra query lenta do banco
 */
export async function trackSlowQuery(
  queryText: string,
  durationMs: number,
  tableName?: string,
  context?: Record<string, any>
) {
  try {
    if (durationMs > 1000) { // Apenas queries > 1s
      await supabase
        .from('slow_queries')
        .insert({
          query_text: queryText,
          duration_ms: durationMs,
          table_name: tableName || null,
          context: context || null
        });
    }
  } catch (error) {
    console.error('Erro ao registrar query lenta:', error);
  }
}

/**
 * Wrapper para medir tempo de execução de uma função
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  endpoint: string,
  type: MetricType = 'api_request'
): Promise<T> {
  const startTime = performance.now();
  let statusCode = 200;
  
  try {
    const result = await fn();
    return result;
  } catch (error) {
    statusCode = 500;
    throw error;
  } finally {
    const duration = Math.round(performance.now() - startTime);
    
    await trackPerformanceMetric({
      type,
      endpoint,
      durationMs: duration,
      statusCode
    });
  }
}

/**
 * Interceptor para queries do Supabase
 */
export function createSupabaseInterceptor() {
  const originalFrom = supabase.from.bind(supabase);
  
  return {
    from: (table: string) => {
      const startTime = performance.now();
      const query = originalFrom(table);
      
      // Intercepta o método select
      const originalSelect = query.select.bind(query);
      query.select = (...args: any[]) => {
        const result = originalSelect(...args);
        
        // Adiciona callback para medir tempo
        result.then((response: any) => {
          const duration = Math.round(performance.now() - startTime);
          
          trackPerformanceMetric({
            type: 'db_query',
            endpoint: `supabase.from('${table}')`,
            durationMs: duration,
            statusCode: response.error ? 500 : 200,
            metadata: { table, operation: 'select' }
          });
          
          // Registra se for query lenta
          if (duration > 1000) {
            trackSlowQuery(
              `SELECT from ${table}`,
              duration,
              table,
              { operation: 'select' }
            );
          }
          
          return response;
        });
        
        return result;
      };
      
      return query;
    }
  };
}

/**
 * Monitora carregamento de página
 */
export function trackPageLoad() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
      
      trackPerformanceMetric({
        type: 'page_load',
        endpoint: window.location.pathname,
        durationMs: loadTime,
        metadata: {
          domInteractive: Math.round(perfData.domInteractive),
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd),
          firstPaint: Math.round(perfData.responseEnd)
        }
      });
    }
  });
}
