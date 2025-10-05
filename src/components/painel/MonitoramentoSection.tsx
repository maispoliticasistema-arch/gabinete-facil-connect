import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceCharts } from './monitoramento/PerformanceCharts';
import { SlowQueriesTable } from './monitoramento/SlowQueriesTable';
import { AlertasAtivos } from './monitoramento/AlertasAtivos';
import { MetricasEmTempoReal } from './monitoramento/MetricasEmTempoReal';
import { Activity } from 'lucide-react';

export function MonitoramentoSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Monitoramento Avançado</h2>
          <p className="text-muted-foreground">
            Performance, queries e alertas em tempo real
          </p>
        </div>
      </div>

      <AlertasAtivos />

      <Tabs defaultValue="tempo-real" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tempo-real">Tempo Real</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="queries">Queries Lentas</TabsTrigger>
        </TabsList>

        <TabsContent value="tempo-real">
          <MetricasEmTempoReal />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="queries">
          <SlowQueriesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
