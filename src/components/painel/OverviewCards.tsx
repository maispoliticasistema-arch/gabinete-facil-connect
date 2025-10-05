import { Card } from '@/components/ui/card';
import { Building2, Users, FileText, Activity, Database, Zap } from 'lucide-react';

interface OverviewCardsProps {
  stats: {
    totalGabinetes: number;
    usuariosAtivos: number;
    demandasHoje: number;
    usoSistema: number;
    usoBanco: number;
    tempoResposta: number;
  };
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gabinetes Ativos</p>
            <p className="text-3xl font-bold mt-2">{stats.totalGabinetes}</p>
          </div>
          <Building2 className="h-10 w-10 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Usuários Ativos (24h)</p>
            <p className="text-3xl font-bold mt-2">{stats.usuariosAtivos}</p>
          </div>
          <Users className="h-10 w-10 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Demandas Hoje</p>
            <p className="text-3xl font-bold mt-2">{stats.demandasHoje}</p>
          </div>
          <FileText className="h-10 w-10 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Uso do Sistema</p>
            <p className="text-3xl font-bold mt-2">{stats.usoSistema}%</p>
          </div>
          <Activity className="h-10 w-10 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Uso do Banco</p>
            <p className="text-3xl font-bold mt-2">{stats.usoBanco}%</p>
          </div>
          <Database className="h-10 w-10 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tempo Resposta</p>
            <p className="text-3xl font-bold mt-2">{stats.tempoResposta}ms</p>
          </div>
          <Zap className="h-10 w-10 text-primary" />
        </div>
      </Card>
    </div>
  );
}
