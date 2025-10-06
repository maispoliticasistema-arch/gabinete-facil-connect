import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGabinete } from "@/contexts/GabineteContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard, NoPermissionMessage } from "@/components/PermissionGuard";
import { AddEventDialog } from "@/components/agenda/AddEventDialog";
import { EventDetailsSheet } from "@/components/agenda/EventDetailsSheet";
import { AgendaStats } from "@/components/agenda/AgendaStats";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Participante {
  user_id: string;
  presente: boolean;
  profiles: {
    nome_completo: string;
  };
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  link_online: string | null;
  tipo: string;
  status: string;
  cor: string;
  data_inicio: string;
  data_fim: string | null;
  agenda_participantes: Participante[];
}

const tipoLabels: Record<string, string> = {
  reuniao: "Reunião",
  visita: "Visita",
  evento_publico: "Evento Público",
  viagem: "Viagem",
  interno: "Interno",
  outros: "Outros",
};

const Agenda = () => {
  const { currentGabinete } = useGabinete();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<any>(null);

  useEffect(() => {
    if (currentGabinete) {
      fetchEventos();
    }
  }, [currentGabinete, selectedDate, viewMode]);

  const fetchEventos = async () => {
    if (!currentGabinete) return;

    let startDate, endDate;

    if (viewMode === "month") {
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else if (viewMode === "week") {
      startDate = startOfWeek(selectedDate, { locale: ptBR });
      endDate = endOfWeek(selectedDate, { locale: ptBR });
    } else {
      startDate = startOfDay(selectedDate);
      endDate = addDays(endDate || startDate, 30);
    }

    // Buscar eventos
    const { data: agendaData, error: agendaError } = await supabase
      .from("agenda")
      .select("*")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .gte("data_inicio", startDate.toISOString())
      .lte("data_inicio", endDate.toISOString())
      .order("data_inicio", { ascending: true });

    if (agendaError) {
      console.error("Erro ao buscar eventos:", agendaError);
      return;
    }

    // Atualizar eventos que já passaram do horário de término
    const agora = new Date();
    const eventosParaAtualizar = (agendaData || []).filter(evento => {
      if (!evento.data_fim) return false;
      const dataFim = new Date(evento.data_fim);
      return dataFim < agora && evento.status !== "concluido" && evento.status !== "cancelado";
    });

    if (eventosParaAtualizar.length > 0) {
      const idsParaAtualizar = eventosParaAtualizar.map(e => e.id);
      await supabase
        .from("agenda")
        .update({ status: "concluido" })
        .in("id", idsParaAtualizar);
    }

    // Buscar participantes e perfis separadamente
    const eventosComParticipantes = await Promise.all(
      (agendaData || []).map(async (evento) => {
        const { data: participantesData } = await supabase
          .from("agenda_participantes")
          .select(`
            user_id,
            presente,
            profiles!fk_agenda_participantes_user_id(nome_completo)
          `)
          .eq("evento_id", evento.id);

        // Atualizar status localmente se foi concluído
        const eventoAtualizado = eventosParaAtualizar.find(e => e.id === evento.id);
        const status = eventoAtualizado ? "concluido" : evento.status;

        return {
          ...evento,
          status,
          agenda_participantes: participantesData || [],
        };
      })
    );

    setEventos(eventosComParticipantes as Evento[]);
  };

  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const matchTipo = filtroTipo === "todos" || evento.tipo === filtroTipo;
      const matchStatus = filtroStatus === "todos" || evento.status === filtroStatus;
      const matchSearch = evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTipo && matchStatus && matchSearch;
    });
  }, [eventos, filtroTipo, filtroStatus, searchTerm]);

  const stats = useMemo(() => {
    const hoje = startOfDay(new Date());
    const fimHoje = endOfDay(new Date());
    const fimSemana = addDays(hoje, 7);
    const fimMes = endOfMonth(new Date());

    return {
      eventosHoje: eventos.filter(e => {
        const dataEvento = new Date(e.data_inicio);
        return dataEvento >= hoje && dataEvento <= fimHoje;
      }).length,
      eventosSemana: eventos.filter(e => {
        const dataEvento = new Date(e.data_inicio);
        return dataEvento >= hoje && dataEvento <= fimSemana;
      }).length,
      eventosMes: eventos.filter(e => {
        const dataEvento = new Date(e.data_inicio);
        return dataEvento >= hoje && dataEvento <= fimMes;
      }).length,
      eventosConcluidos: eventos.filter(e => e.status === "concluido").length,
    };
  }, [eventos]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    filteredEventos.forEach((evento) => {
      const dateKey = format(new Date(evento.data_inicio), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, evento]);
    });
    return map;
  }, [filteredEventos]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleEventClick = (evento: Evento) => {
    setSelectedEvento(evento);
    setDetailsSheetOpen(true);
  };

  const handleEditEvento = (evento: Evento) => {
    setEditingEvento(evento);
    setAddDialogOpen(true);
  };

  // Verificar permissão de visualização
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!hasPermission('view_agenda')) {
    return <NoPermissionMessage />;
  }

  return (
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agenda do Gabinete</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organize compromissos, reuniões e eventos
          </p>
        </div>
        <PermissionGuard permission="create_agenda">
          <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Evento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </PermissionGuard>
      </div>

      <AgendaStats {...stats} />

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="evento_publico">Evento Público</SelectItem>
              <SelectItem value="viagem">Viagem</SelectItem>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredEventos.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </Card>
          ) : (
            filteredEventos.map((evento) => (
              <Card
                key={evento.id}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleEventClick(evento)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-1 h-full rounded-full"
                    style={{ backgroundColor: evento.cor }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{evento.titulo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(evento.data_inicio), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                      <Badge variant="outline">{tipoLabels[evento.tipo]}</Badge>
                    </div>
                    {evento.local && (
                      <p className="text-sm text-muted-foreground mt-1">{evento.local}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-4 md:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-center w-full">
              <div className="w-full max-w-2xl">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ptBR}
                  className="w-full flex justify-center"
                  modifiers={{
                    hasEvent: (date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      return eventosPorDia.has(dateKey);
                    },
                  }}
                  modifiersClassNames={{
                    hasEvent: "bg-primary/10 font-bold",
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              Eventos - {format(selectedDate, "dd/MM/yyyy")}
            </h3>
            <div className="space-y-2">
              {(() => {
                const dateKey = format(selectedDate, "yyyy-MM-dd");
                const eventosData = eventosPorDia.get(dateKey) || [];
                
                if (eventosData.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum evento neste dia
                    </p>
                  );
                }

                return eventosData.map((evento) => (
                  <Card
                    key={evento.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleEventClick(evento)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: evento.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{evento.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evento.data_inicio), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ));
              })()}
            </div>
          </Card>
        </div>
      )}

      <AddEventDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingEvento(null);
        }}
        onEventAdded={() => {
          fetchEventos();
          setEditingEvento(null);
        }}
        initialDate={selectedDate}
        editEvento={editingEvento}
      />

      <EventDetailsSheet
        evento={selectedEvento}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        onEdit={handleEditEvento}
        onEventoUpdated={fetchEventos}
      />
    </div>
  );
};

export default Agenda;
