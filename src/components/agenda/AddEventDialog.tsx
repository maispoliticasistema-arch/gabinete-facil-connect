import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGabinete } from "@/contexts/GabineteContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assessor {
  user_id: string;
  profiles: {
    nome_completo: string;
  };
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: () => void;
  initialDate?: Date;
}

const tiposEvento = [
  { value: "reuniao", label: "Reunião" },
  { value: "visita", label: "Visita" },
  { value: "evento_publico", label: "Evento Público" },
  { value: "viagem", label: "Viagem" },
  { value: "interno", label: "Interno" },
  { value: "outros", label: "Outros" },
];

const statusEvento = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const cores = [
  { value: "#6366f1", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f43f5e", label: "Vermelho" },
  { value: "#f97316", label: "Laranja" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#22c55e", label: "Verde" },
  { value: "#14b8a6", label: "Turquesa" },
];

export function AddEventDialog({ open, onOpenChange, onEventAdded, initialDate }: AddEventDialogProps) {
  const { user } = useAuth();
  const { currentGabinete } = useGabinete();
  
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [linkOnline, setLinkOnline] = useState("");
  const [tipo, setTipo] = useState("reuniao");
  const [status, setStatus] = useState("pendente");
  const [cor, setCor] = useState("#6366f1");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(initialDate || new Date());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [dataFim, setDataFim] = useState<Date | undefined>(initialDate || new Date());
  const [horaFim, setHoraFim] = useState("10:00");
  const [assessores, setAssessores] = useState<Assessor[]>([]);
  const [selectedParticipantes, setSelectedParticipantes] = useState<string[]>([]);
  const [searchParticipante, setSearchParticipante] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentGabinete) {
      fetchAssessores();
    }
  }, [open, currentGabinete]);

  const fetchAssessores = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from("user_gabinetes")
      .select("user_id, profiles(nome_completo)")
      .eq("gabinete_id", currentGabinete.gabinete_id)
      .eq("ativo", true);

    if (error) {
      console.error("Erro ao buscar assessores:", error);
      return;
    }

    setAssessores(data || []);
  };

  const toggleParticipante = (userId: string) => {
    setSelectedParticipantes(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredAssessores = searchParticipante.length >= 2
    ? assessores.filter(a =>
        a.profiles?.nome_completo?.toLowerCase().includes(searchParticipante.toLowerCase())
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentGabinete) return;

    if (!titulo || !dataInicio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e data de início",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dataInicioCompleta = new Date(dataInicio);
      const [horaI, minI] = horaInicio.split(":");
      dataInicioCompleta.setHours(parseInt(horaI), parseInt(minI));

      const dataFimCompleta = dataFim ? new Date(dataFim) : new Date(dataInicio);
      const [horaF, minF] = horaFim.split(":");
      dataFimCompleta.setHours(parseInt(horaF), parseInt(minF));

      const { data: evento, error: eventoError } = await supabase
        .from("agenda")
        .insert({
          gabinete_id: currentGabinete.gabinete_id,
          criado_por: user.id,
          titulo,
          descricao,
          local,
          link_online: linkOnline,
          tipo,
          status,
          cor,
          data_inicio: dataInicioCompleta.toISOString(),
          data_fim: dataFimCompleta.toISOString(),
        })
        .select()
        .single();

      if (eventoError) throw eventoError;

      if (selectedParticipantes.length > 0) {
        const participantes = selectedParticipantes.map(userId => ({
          evento_id: evento.id,
          user_id: userId,
        }));

        const { error: participantesError } = await supabase
          .from("agenda_participantes")
          .insert(participantes);

        if (participantesError) throw participantesError;
      }

      toast({
        title: "Evento criado",
        description: "O evento foi adicionado à agenda",
      });

      resetForm();
      onEventAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setLocal("");
    setLinkOnline("");
    setTipo("reuniao");
    setStatus("pendente");
    setCor("#6366f1");
    setDataInicio(new Date());
    setHoraInicio("09:00");
    setDataFim(new Date());
    setHoraFim("10:00");
    setSelectedParticipantes([]);
    setSearchParticipante("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com associação de moradores"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposEvento.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusEvento.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {cores.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    cor === c.value ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setCor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora de Início</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora de Término</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Endereço ou nome do local"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkOnline">Link Online (opcional)</Label>
            <Input
              id="linkOnline"
              value={linkOnline}
              onChange={(e) => setLinkOnline(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações, pauta, observações..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Participantes</Label>
            {selectedParticipantes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedParticipantes.map((userId) => {
                  const assessor = assessores.find((a) => a.user_id === userId);
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                    >
                      <span>{assessor?.profiles?.nome_completo}</span>
                      <button
                        type="button"
                        onClick={() => toggleParticipante(userId)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <Input
              placeholder="Buscar participantes..."
              value={searchParticipante}
              onChange={(e) => setSearchParticipante(e.target.value)}
            />
            {filteredAssessores.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {filteredAssessores.map((assessor) => (
                  <button
                    key={assessor.user_id}
                    type="button"
                    onClick={() => {
                      toggleParticipante(assessor.user_id);
                      setSearchParticipante("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                      selectedParticipantes.includes(assessor.user_id) && "bg-accent"
                    )}
                  >
                    {assessor.profiles?.nome_completo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
