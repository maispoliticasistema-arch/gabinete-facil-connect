import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface SystemAlert {
  id: string;
  created_at: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  resolved: boolean;
  auto_resolved: boolean;
  metric_value: number;
  threshold_value: number;
  resolved_at: string;
}

export function AlertasAtivos() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    loadAlerts();

    // Real-time para novos alertas
    const channel = supabase
      .channel('system-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_alerts'
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAlerts() {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts((data || []) as SystemAlert[]);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      await loadAlerts();
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: string): 'default' | 'destructive' => {
    return severity === 'critical' ? 'destructive' : 'default';
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
          {getAlertIcon(alert.severity)}
          <AlertTitle className="flex items-center justify-between">
            <span>{alert.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolveAlert(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
