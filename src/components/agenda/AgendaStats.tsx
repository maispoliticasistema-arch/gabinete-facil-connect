import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface AgendaStatsProps {
  eventosHoje: number;
  eventosSemana: number;
  eventosMes: number;
  eventosConcluidos: number;
}

export function AgendaStats({ eventosHoje, eventosSemana, eventosMes, eventosConcluidos }: AgendaStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hoje</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventosHoje}</div>
          <p className="text-xs text-muted-foreground">
            {eventosHoje === 1 ? "evento" : "eventos"} agendados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventosSemana}</div>
          <p className="text-xs text-muted-foreground">
            próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventosMes}</div>
          <p className="text-xs text-muted-foreground">
            total do mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventosConcluidos}</div>
          <p className="text-xs text-muted-foreground">
            eventos realizados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
