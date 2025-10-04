import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Users, Calendar, Route } from "lucide-react";

interface RelatoriosStatsProps {
  stats: {
    totalDemandas: number;
    demandasConcluidas: number;
    demandasAndamento: number;
    eleitoresCadastrados: number;
    eventosRealizados: number;
    roteirosExecutados: number;
  };
}

export function RelatoriosStats({ stats }: RelatoriosStatsProps) {
  const statCards = [
    {
      title: "Total de Demandas",
      value: stats.totalDemandas,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Demandas Concluídas",
      value: stats.demandasConcluidas,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Em Andamento",
      value: stats.demandasAndamento,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Eleitores Cadastrados",
      value: stats.eleitoresCadastrados,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Eventos Realizados",
      value: stats.eventosRealizados,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Roteiros Executados",
      value: stats.roteirosExecutados,
      icon: Route,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}