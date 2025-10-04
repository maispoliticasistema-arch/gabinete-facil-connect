import { useState, useEffect } from "react";
import { useGabinete } from "@/contexts/GabineteContext";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermissionMessage } from "@/components/PermissionGuard";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RelatoriosStats } from "@/components/relatorios/RelatoriosStats";
import { DemandasChart } from "@/components/relatorios/DemandasChart";
import { EleitoresChart } from "@/components/relatorios/EleitoresChart";
import { ExportButtons } from "@/components/relatorios/ExportButtons";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Relatorios = () => {
  const { currentGabinete } = useGabinete();
  const { hasPermission } = usePermissions();
  const [periodo, setPeriodo] = useState("30");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalDemandas: 0,
    demandasConcluidas: 0,
    demandasAndamento: 0,
    eleitoresCadastrados: 0,
    eventosRealizados: 0,
    roteirosExecutados: 0,
  });

  const [demandasData, setDemandasData] = useState({
    evolucaoMensal: [] as { mes: string; abertas: number; concluidas: number }[],
    porBairro: [] as { bairro: string; total: number }[],
    porCidade: [] as { cidade: string; total: number }[],
    porStatus: [] as { status: string; total: number; color: string }[],
  });

  const [eleitoresData, setEleitoresData] = useState({
    crescimentoMensal: [] as { mes: string; total: number }[],
    porBairro: [] as { bairro: string; total: number }[],
  });

  useEffect(() => {
    if (currentGabinete) {
      fetchAllData();
    }
  }, [currentGabinete, periodo]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (periodo) {
      case "7":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "365":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
  };

  const fetchAllData = async () => {
    if (!currentGabinete) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchDemandasData(),
        fetchEleitoresData(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!currentGabinete) return;

    const { startDate } = getDateRange();

    // Total de demandas
    const { count: totalDemandas } = await supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .gte("created_at", startDate.toISOString());

    // Demandas concluídas
    const { count: demandasConcluidas } = await supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluida")
      .gte("created_at", startDate.toISOString());

    // Demandas em andamento
    const { count: demandasAndamento } = await supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "aberta")
      .gte("created_at", startDate.toISOString());

    // Eleitores cadastrados
    const { count: eleitoresCadastrados } = await supabase
      .from("eleitores")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id);

    // Eventos realizados
    const { count: eventosRealizados } = await supabase
      .from("agenda")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluido")
      .gte("data_inicio", startDate.toISOString());

    // Roteiros executados
    const { count: roteirosExecutados } = await supabase
      .from("roteiros")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluido")
      .gte("data", startDate.toISOString().split("T")[0]);

    setStats({
      totalDemandas: totalDemandas || 0,
      demandasConcluidas: demandasConcluidas || 0,
      demandasAndamento: demandasAndamento || 0,
      eleitoresCadastrados: eleitoresCadastrados || 0,
      eventosRealizados: eventosRealizados || 0,
      roteirosExecutados: roteirosExecutados || 0,
    });
  };

  const fetchDemandasData = async () => {
    if (!currentGabinete) return;

    // Evolução mensal - últimos 6 meses
    const mesesPassados = Array.from({ length: 6 }, (_, i) => {
      const data = subMonths(new Date(), i);
      return {
        mes: format(data, "MMM/yy", { locale: ptBR }),
        inicio: startOfMonth(data),
        fim: endOfMonth(data),
      };
    }).reverse();

    const evolucaoMensal = await Promise.all(
      mesesPassados.map(async ({ mes, inicio, fim }) => {
        const { count: abertas } = await supabase
          .from("demandas")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .gte("created_at", inicio.toISOString())
          .lte("created_at", fim.toISOString());

        const { count: concluidas } = await supabase
          .from("demandas")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .eq("status", "concluida")
          .gte("concluida_em", inicio.toISOString())
          .lte("concluida_em", fim.toISOString());

        return { mes, abertas: abertas || 0, concluidas: concluidas || 0 };
      })
    );

    // Por bairro - dos eleitores vinculados
    const { data: demandas } = await supabase
      .from("demandas")
      .select("eleitor_id")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .not("eleitor_id", "is", null);

    const eleitorIds = demandas?.map(d => d.eleitor_id) || [];
    
    const { data: eleitores } = await supabase
      .from("eleitores")
      .select("bairro, cidade")
      .in("id", eleitorIds);

    const bairroCount = (eleitores || []).reduce((acc: any, e) => {
      const bairro = e.bairro || "Não informado";
      acc[bairro] = (acc[bairro] || 0) + 1;
      return acc;
    }, {});

    const porBairro = Object.entries(bairroCount)
      .map(([bairro, total]) => ({ bairro, total: total as number }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Por cidade
    const cidadeCount = (eleitores || []).reduce((acc: any, e) => {
      const cidade = e.cidade || "Não informado";
      acc[cidade] = (acc[cidade] || 0) + 1;
      return acc;
    }, {});

    const porCidade = Object.entries(cidadeCount)
      .map(([cidade, total]) => ({ cidade, total: total as number }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Por status
    const { data: statusData } = await supabase
      .from("demandas")
      .select("status")
      .eq("gabinete_id", currentGabinete.gabinete_id);

    const statusCount = (statusData || []).reduce((acc: any, d) => {
      const status = d.status === "aberta" ? "Aberta" : d.status === "concluida" ? "Concluída" : "Cancelada";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusColors: any = {
      "Aberta": "#f59e0b",
      "Concluída": "#10b981",
      "Cancelada": "#ef4444",
    };

    const porStatus = Object.entries(statusCount).map(([status, total]) => ({
      status,
      total: total as number,
      color: statusColors[status],
    }));

    setDemandasData({ evolucaoMensal, porBairro, porCidade, porStatus });
  };

  const fetchEleitoresData = async () => {
    if (!currentGabinete) return;

    // Crescimento mensal - últimos 6 meses
    const mesesPassados = Array.from({ length: 6 }, (_, i) => {
      const data = subMonths(new Date(), i);
      return {
        mes: format(data, "MMM/yy", { locale: ptBR }),
        fim: endOfMonth(data),
      };
    }).reverse();

    const crescimentoMensal = await Promise.all(
      mesesPassados.map(async ({ mes, fim }) => {
        const { count } = await supabase
          .from("eleitores")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .lte("created_at", fim.toISOString());

        return { mes, total: count || 0 };
      })
    );

    // Por bairro
    const { data: eleitores } = await supabase
      .from("eleitores")
      .select("bairro")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .not("bairro", "is", null);

    const bairroCount = (eleitores || []).reduce((acc: any, e) => {
      const bairro = e.bairro || "Não informado";
      acc[bairro] = (acc[bairro] || 0) + 1;
      return acc;
    }, {});

    const porBairro = Object.entries(bairroCount)
      .map(([bairro, total]) => ({ bairro, total: total as number }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setEleitoresData({ crescimentoMensal, porBairro });
  };

  const exportToXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Stats
      const statsWS = XLSX.utils.json_to_sheet([
        { Indicador: "Total de Demandas", Valor: stats.totalDemandas },
        { Indicador: "Demandas Concluídas", Valor: stats.demandasConcluidas },
        { Indicador: "Demandas em Andamento", Valor: stats.demandasAndamento },
        { Indicador: "Eleitores Cadastrados", Valor: stats.eleitoresCadastrados },
        { Indicador: "Eventos Realizados", Valor: stats.eventosRealizados },
        { Indicador: "Roteiros Executados", Valor: stats.roteirosExecutados },
      ]);
      XLSX.utils.book_append_sheet(wb, statsWS, "Resumo");

      // Demandas
      const demandasWS = XLSX.utils.json_to_sheet(demandasData.evolucaoMensal);
      XLSX.utils.book_append_sheet(wb, demandasWS, "Demandas");

      // Eleitores
      const eleitoresWS = XLSX.utils.json_to_sheet(eleitoresData.crescimentoMensal);
      XLSX.utils.book_append_sheet(wb, eleitoresWS, "Eleitores");

      XLSX.writeFile(wb, `relatorio-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Planilha exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar planilha");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório do Gabinete", 14, 20);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 28);
      doc.text(`Gabinete: ${currentGabinete?.gabinetes?.nome || ""}`, 14, 34);
      
      // Resumo Geral
      doc.setFontSize(14);
      doc.text("Resumo Geral", 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total de Demandas", stats.totalDemandas.toString()],
          ["Demandas Concluídas", stats.demandasConcluidas.toString()],
          ["Demandas em Andamento", stats.demandasAndamento.toString()],
          ["Eleitores Cadastrados", stats.eleitoresCadastrados.toString()],
          ["Eventos Realizados", stats.eventosRealizados.toString()],
          ["Roteiros Executados", stats.roteirosExecutados.toString()],
        ],
      });
      
      // Evolução Mensal de Demandas
      const finalY1 = (doc as any).lastAutoTable.finalY || 50;
      doc.setFontSize(14);
      doc.text("Evolução Mensal de Demandas", 14, finalY1 + 10);
      
      autoTable(doc, {
        startY: finalY1 + 15,
        head: [["Mês", "Abertas", "Concluídas"]],
        body: demandasData.evolucaoMensal.map(item => [
          item.mes,
          item.abertas.toString(),
          item.concluidas.toString(),
        ]),
      });
      
      // Demandas por Bairro
      const finalY2 = (doc as any).lastAutoTable.finalY || 50;
      doc.setFontSize(14);
      doc.text("Top 10 Demandas por Bairro", 14, finalY2 + 10);
      
      autoTable(doc, {
        startY: finalY2 + 15,
        head: [["Bairro", "Total"]],
        body: demandasData.porBairro.map(item => [
          item.bairro,
          item.total.toString(),
        ]),
      });
      
      // Nova página para mais dados
      doc.addPage();
      
      // Demandas por Cidade
      doc.setFontSize(14);
      doc.text("Top 10 Demandas por Cidade", 14, 20);
      
      autoTable(doc, {
        startY: 25,
        head: [["Cidade", "Total"]],
        body: demandasData.porCidade.map(item => [
          item.cidade,
          item.total.toString(),
        ]),
      });
      
      // Crescimento de Eleitores
      const finalY3 = (doc as any).lastAutoTable.finalY || 50;
      doc.setFontSize(14);
      doc.text("Crescimento Mensal de Eleitores", 14, finalY3 + 10);
      
      autoTable(doc, {
        startY: finalY3 + 15,
        head: [["Mês", "Total Acumulado"]],
        body: eleitoresData.crescimentoMensal.map(item => [
          item.mes,
          item.total.toString(),
        ]),
      });
      
      doc.save(`relatorio-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  // Verificar permissão
  if (!hasPermission("view_relatorios")) {
    return <NoPermissionMessage />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e prestação de contas do gabinete
          </p>
        </div>

        <div className="w-48">
          <Label>Período</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RelatoriosStats stats={stats} />

      <Tabs defaultValue="demandas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="demandas">Demandas</TabsTrigger>
          <TabsTrigger value="eleitores">Eleitores</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="roteiros">Roteiros</TabsTrigger>
        </TabsList>

        <TabsContent value="demandas">
          <DemandasChart {...demandasData} />
        </TabsContent>

        <TabsContent value="eleitores">
          <EleitoresChart {...eleitoresData} />
        </TabsContent>

        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráficos de agenda em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roteiros">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Roteiros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráficos de roteiros em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportButtons onExportXLSX={exportToXLSX} onExportPDF={exportToPDF} />
    </div>
  );
};

export default Relatorios;