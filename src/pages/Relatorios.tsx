import { useState, useEffect } from "react";
import { useGabinete } from "@/contexts/GabineteContext";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermissionMessage } from "@/components/PermissionGuard";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RelatoriosStats } from "@/components/relatorios/RelatoriosStats";
import { DemandasChart } from "@/components/relatorios/DemandasChart";
import { EleitoresChart } from "@/components/relatorios/EleitoresChart";
import { RoteirosChart } from "@/components/relatorios/RoteirosChart";
import { AgendaChart } from "@/components/relatorios/AgendaChart";
import { ExportButtons } from "@/components/relatorios/ExportButtons";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Relatorios = () => {
  const { currentGabinete } = useGabinete();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [periodo, setPeriodo] = useState("30");
  const [assessorId, setAssessorId] = useState<string>("todos");
  const [assessores, setAssessores] = useState<{ id: string; nome: string }[]>([]);
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

  const [roteirosData, setRoteirosData] = useState({
    evolucaoMensal: [] as { mes: string; planejados: number; concluidos: number }[],
    totalKm: 0,
    kmMedio: 0,
    locaisVisitados: 0,
    totalPontos: 0,
    porStatus: [] as { status: string; total: number; color: string }[],
  });

  const [agendaData, setAgendaData] = useState({
    evolucaoMensal: [] as { mes: string; realizados: number; cancelados: number }[],
    porTipo: [] as { tipo: string; total: number }[],
    porStatus: [] as { status: string; total: number; color: string }[],
  });

  useEffect(() => {
    if (currentGabinete) {
      fetchAssessores();
      fetchAllData();
    }
  }, [currentGabinete, periodo, assessorId]);

  const fetchAssessores = async () => {
    if (!currentGabinete) return;

    const { data } = await supabase
      .from("user_gabinetes")
      .select("user_id, profiles(nome_completo)")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("ativo", true);

    if (data) {
      const assessoresList = data.map((item: any) => ({
        id: item.user_id,
        nome: item.profiles?.nome_completo || "Sem nome",
      }));
      setAssessores(assessoresList);
    }
  };

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
        fetchRoteirosData(),
        fetchAgendaData(),
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
    const assessorFilter = assessorId !== "todos" ? assessorId : null;

    // Total de demandas
    let demandasQuery = supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .gte("created_at", startDate.toISOString());
    
    if (assessorFilter) {
      demandasQuery = demandasQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { count: totalDemandas } = await demandasQuery;

    // Demandas concluídas
    let concluidasQuery = supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluida")
      .gte("created_at", startDate.toISOString());
    
    if (assessorFilter) {
      concluidasQuery = concluidasQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { count: demandasConcluidas } = await concluidasQuery;

    // Demandas em andamento
    let andamentoQuery = supabase
      .from("demandas")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "aberta")
      .gte("created_at", startDate.toISOString());
    
    if (assessorFilter) {
      andamentoQuery = andamentoQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { count: demandasAndamento } = await andamentoQuery;

    // Eleitores cadastrados
    let eleitoresQuery = supabase
      .from("eleitores")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id);
    
    if (assessorFilter) {
      eleitoresQuery = eleitoresQuery.eq("cadastrado_por", assessorFilter);
    }
    const { count: eleitoresCadastrados } = await eleitoresQuery;

    // Eventos realizados
    let eventosQuery = supabase
      .from("agenda")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluido")
      .gte("data_inicio", startDate.toISOString());
    
    if (assessorFilter) {
      eventosQuery = eventosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { count: eventosRealizados } = await eventosQuery;

    // Roteiros executados
    let roteirosQuery = supabase
      .from("roteiros")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("status", "concluido")
      .gte("data", startDate.toISOString().split("T")[0]);
    
    if (assessorFilter) {
      roteirosQuery = roteirosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { count: roteirosExecutados } = await roteirosQuery;

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

    const assessorFilter = assessorId !== "todos" ? assessorId : null;

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
        let abertasQuery = supabase
          .from("demandas")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .gte("created_at", inicio.toISOString())
          .lte("created_at", fim.toISOString());
        
        if (assessorFilter) {
          abertasQuery = abertasQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: abertas } = await abertasQuery;

        let concluidasQuery = supabase
          .from("demandas")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .eq("status", "concluida")
          .gte("concluida_em", inicio.toISOString())
          .lte("concluida_em", fim.toISOString());
        
        if (assessorFilter) {
          concluidasQuery = concluidasQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: concluidas } = await concluidasQuery;

        return { mes, abertas: abertas || 0, concluidas: concluidas || 0 };
      })
    );

    // Por bairro - dos eleitores vinculados
    let demandasQuery = supabase
      .from("demandas")
      .select("eleitor_id")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .not("eleitor_id", "is", null);
    
    if (assessorFilter) {
      demandasQuery = demandasQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: demandas } = await demandasQuery;

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
    let statusQuery = supabase
      .from("demandas")
      .select("status")
      .eq("gabinete_id", currentGabinete.gabinete_id);
    
    if (assessorFilter) {
      statusQuery = statusQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: statusData } = await statusQuery;

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

    const assessorFilter = assessorId !== "todos" ? assessorId : null;

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
        let query = supabase
          .from("eleitores")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .lte("created_at", fim.toISOString());
        
        if (assessorFilter) {
          query = query.eq("cadastrado_por", assessorFilter);
        }
        const { count } = await query;

        return { mes, total: count || 0 };
      })
    );

    // Por bairro
    let eleitoresQuery = supabase
      .from("eleitores")
      .select("bairro")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .not("bairro", "is", null);
    
    if (assessorFilter) {
      eleitoresQuery = eleitoresQuery.eq("cadastrado_por", assessorFilter);
    }
    const { data: eleitores } = await eleitoresQuery;

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

  const fetchRoteirosData = async () => {
    if (!currentGabinete) return;

    const assessorFilter = assessorId !== "todos" ? assessorId : null;

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
        let planejadosQuery = supabase
          .from("roteiros")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .gte("data", inicio.toISOString().split("T")[0])
          .lte("data", fim.toISOString().split("T")[0]);
        
        if (assessorFilter) {
          planejadosQuery = planejadosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: planejados } = await planejadosQuery;

        let concluidosQuery = supabase
          .from("roteiros")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .eq("status", "concluido")
          .gte("data", inicio.toISOString().split("T")[0])
          .lte("data", fim.toISOString().split("T")[0]);
        
        if (assessorFilter) {
          concluidosQuery = concluidosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: concluidos } = await concluidosQuery;

        return { mes, planejados: planejados || 0, concluidos: concluidos || 0 };
      })
    );

    // Km total e médio
    let roteirosQuery = supabase
      .from("roteiros")
      .select("id, distancia_total")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .not("distancia_total", "is", null);
    
    if (assessorFilter) {
      roteirosQuery = roteirosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: roteiros } = await roteirosQuery;

    const totalKm = (roteiros || []).reduce((acc, r) => acc + Number(r.distancia_total || 0), 0);
    const kmMedio = roteiros && roteiros.length > 0 ? totalKm / roteiros.length : 0;

    const roteiroIds = (roteiros || []).map(r => r.id);

    // Locais visitados
    const { count: locaisVisitados } = await supabase
      .from("roteiro_pontos")
      .select("*", { count: "exact", head: true })
      .in("roteiro_id", roteiroIds)
      .eq("visitado", true);

    // Total de pontos
    const { count: totalPontos } = await supabase
      .from("roteiro_pontos")
      .select("*", { count: "exact", head: true })
      .in("roteiro_id", roteiroIds);

    // Por status
    let statusQuery = supabase
      .from("roteiros")
      .select("status")
      .eq("gabinete_id", currentGabinete.gabinete_id);
    
    if (assessorFilter) {
      statusQuery = statusQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: statusData } = await statusQuery;

    const statusCount = (statusData || []).reduce((acc: any, r) => {
      const status = r.status === "planejado" ? "Planejado" : 
                     r.status === "em_andamento" ? "Em Andamento" : 
                     r.status === "concluido" ? "Concluído" : "Cancelado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusColors: any = {
      "Planejado": "#3b82f6",
      "Em Andamento": "#f59e0b",
      "Concluído": "#10b981",
      "Cancelado": "#ef4444",
    };

    const porStatus = Object.entries(statusCount).map(([status, total]) => ({
      status,
      total: total as number,
      color: statusColors[status],
    }));

    setRoteirosData({
      evolucaoMensal,
      totalKm: Math.round(totalKm),
      kmMedio: Math.round(kmMedio * 10) / 10,
      locaisVisitados: locaisVisitados || 0,
      totalPontos: totalPontos || 0,
      porStatus,
    });
  };

  const fetchAgendaData = async () => {
    if (!currentGabinete) return;

    const assessorFilter = assessorId !== "todos" ? assessorId : null;

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
        let realizadosQuery = supabase
          .from("agenda")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .eq("status", "concluido")
          .gte("data_inicio", inicio.toISOString())
          .lte("data_inicio", fim.toISOString());
        
        if (assessorFilter) {
          realizadosQuery = realizadosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: realizados } = await realizadosQuery;

        let canceladosQuery = supabase
          .from("agenda")
          .select("*", { count: "exact", head: true })
          .eq("gabinete_id", currentGabinete.gabinete_id)
          .eq("status", "cancelado")
          .gte("data_inicio", inicio.toISOString())
          .lte("data_inicio", fim.toISOString());
        
        if (assessorFilter) {
          canceladosQuery = canceladosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
        }
        const { count: cancelados } = await canceladosQuery;

        return { mes, realizados: realizados || 0, cancelados: cancelados || 0 };
      })
    );

    // Por tipo
    let eventosQuery = supabase
      .from("agenda")
      .select("tipo")
      .eq("gabinete_id", currentGabinete.gabinete_id);
    
    if (assessorFilter) {
      eventosQuery = eventosQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: eventos } = await eventosQuery;

    const tipoCount = (eventos || []).reduce((acc: any, e) => {
      const tipo = e.tipo === "reuniao" ? "Reunião" : 
                   e.tipo === "visita" ? "Visita" : 
                   e.tipo === "evento" ? "Evento" : "Outro";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const porTipo = Object.entries(tipoCount)
      .map(([tipo, total]) => ({ tipo, total: total as number }))
      .sort((a, b) => b.total - a.total);

    // Por status
    let statusQuery = supabase
      .from("agenda")
      .select("status")
      .eq("gabinete_id", currentGabinete.gabinete_id);
    
    if (assessorFilter) {
      statusQuery = statusQuery.or(`criado_por.eq.${assessorFilter},responsavel_id.eq.${assessorFilter}`);
    }
    const { data: statusData } = await statusQuery;

    const statusCount = (statusData || []).reduce((acc: any, e) => {
      const status = e.status === "pendente" ? "Pendente" : 
                     e.status === "em_andamento" ? "Em Andamento" : 
                     e.status === "concluido" ? "Concluído" : "Cancelado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusColors: any = {
      "Pendente": "#f59e0b",
      "Em Andamento": "#3b82f6",
      "Concluído": "#10b981",
      "Cancelado": "#ef4444",
    };

    const porStatus = Object.entries(statusCount).map(([status, total]) => ({
      status,
      total: total as number,
      color: statusColors[status],
    }));

    setAgendaData({ evolucaoMensal, porTipo, porStatus });
  };

  const exportToXLSX = async () => {
    if (!currentGabinete) return;
    
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
      
      // Registrar log de auditoria
      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'export_report',
        entityType: 'relatorio',
        details: { 
          tipo: 'XLSX',
          periodo,
          assessor: assessorId !== 'todos' ? assessores.find(a => a.id === assessorId)?.nome : 'Todos'
        }
      });
      
      toast.success("Planilha exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar planilha");
    }
  };

  const exportToPDF = async () => {
    if (!currentGabinete) return;
    
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório do Gabinete", 14, 20);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 28);
      doc.text(`Gabinete: ${currentGabinete?.gabinetes?.nome || ""}`, 14, 34);
      
      if (assessorId !== "todos") {
        const assessorNome = assessores.find(a => a.id === assessorId)?.nome || "Não identificado";
        doc.text(`Assessor: ${assessorNome}`, 14, 40);
      }
      
      // Resumo Geral
      doc.setFontSize(14);
      doc.text("Resumo Geral", 14, assessorId !== "todos" ? 51 : 45);
      
      autoTable(doc, {
        startY: assessorId !== "todos" ? 56 : 50,
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
      
      // Registrar log de auditoria
      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'export_report',
        entityType: 'relatorio',
        details: { 
          tipo: 'PDF',
          periodo,
          assessor: assessorId !== 'todos' ? assessores.find(a => a.id === assessorId)?.nome : 'Todos'
        }
      });
      
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  // Verificar permissão
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

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
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Relatórios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análises e prestação de contas do gabinete
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
          <div className="flex-1 sm:flex-initial sm:w-40 lg:w-48">
            <Label className="text-xs sm:text-sm">Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-full">
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

          <div className="flex-1 sm:flex-initial sm:w-40 lg:w-48">
            <Label className="text-xs sm:text-sm">Assessor</Label>
            <Select value={assessorId} onValueChange={setAssessorId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {assessores.map((assessor) => (
                  <SelectItem key={assessor.id} value={assessor.id}>
                    {assessor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <RelatoriosStats stats={stats} />

      <Tabs defaultValue="demandas" className="space-y-4 md:space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="demandas" className="text-xs sm:text-sm">Demandas</TabsTrigger>
          <TabsTrigger value="eleitores" className="text-xs sm:text-sm">Eleitores</TabsTrigger>
          <TabsTrigger value="agenda" className="text-xs sm:text-sm">Agenda</TabsTrigger>
          <TabsTrigger value="roteiros" className="text-xs sm:text-sm">Roteiros</TabsTrigger>
        </TabsList>

        <TabsContent value="demandas">
          <DemandasChart {...demandasData} />
        </TabsContent>

        <TabsContent value="eleitores">
          <EleitoresChart {...eleitoresData} />
        </TabsContent>

        <TabsContent value="agenda">
          <AgendaChart {...agendaData} />
        </TabsContent>

        <TabsContent value="roteiros">
          <RoteirosChart {...roteirosData} />
        </TabsContent>
      </Tabs>

      <ExportButtons onExportXLSX={exportToXLSX} onExportPDF={exportToPDF} />
    </div>
  );
};

export default Relatorios;