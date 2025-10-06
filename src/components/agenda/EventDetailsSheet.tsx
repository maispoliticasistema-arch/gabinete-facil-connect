import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, Link as LinkIcon, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/auditLog";
import { useGabinete } from "@/contexts/GabineteContext";

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

interface EventDetailsSheetProps {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (evento: Evento) => void;
  onEventoUpdated?: () => void;
}

const tipoLabels: Record<string, string> = {
  reuniao: "Reunião",
  visita: "Visita",
  evento_publico: "Evento Público",
  viagem: "Viagem",
  interno: "Interno",
  outros: "Outros",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "outline",
  confirmado: "default",
  concluido: "secondary",
  cancelado: "destructive",
};

export function EventDetailsSheet({ evento, open, onOpenChange, onEdit, onEventoUpdated }: EventDetailsSheetProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();

  if (!evento) return null;

  const handleEdit = () => {
    onEdit(evento);
    onOpenChange(false);
  };

  const handleCancelar = async () => {
    if (!currentGabinete) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agenda')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', evento.id);

      if (error) throw error;

      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'delete',
        entityType: 'agenda',
        entityId: evento.id,
        details: {
          titulo: evento.titulo,
          data_inicio: evento.data_inicio
        }
      });

      toast({
        title: 'Evento excluído',
        description: 'O evento foi removido da agenda.',
      });

      onOpenChange(false);
      onEventoUpdated?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir evento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const dataInicio = new Date(evento.data_inicio);
  const dataFim = evento.data_fim ? new Date(evento.data_fim) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: evento.cor }}
            />
            <div className="flex-1">
              <SheetTitle className="text-xl">{evento.titulo}</SheetTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{tipoLabels[evento.tipo]}</Badge>
                <Badge variant={statusVariants[evento.status]}>
                  {statusLabels[evento.status]}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Data e Hora */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Horário</p>
                <p className="text-sm text-muted-foreground">
                  {format(dataInicio, "HH:mm")}
                  {dataFim && ` - ${format(dataFim, "HH:mm")}`}
                </p>
              </div>
            </div>
          </div>

          {/* Local */}
          {evento.local && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Local</p>
                <p className="text-sm text-muted-foreground">{evento.local}</p>
              </div>
            </div>
          )}

          {/* Link Online */}
          {evento.link_online && (
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Link Online</p>
                <a
                  href={evento.link_online}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {evento.link_online}
                </a>
              </div>
            </div>
          )}

          {/* Descrição */}
          {evento.descricao && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {evento.descricao}
                </p>
              </div>
            </div>
          )}

          {/* Participantes */}
          {evento.agenda_participantes && evento.agenda_participantes.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-2">Participantes</p>
                <div className="space-y-2">
                  {evento.agenda_participantes.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>{p.profiles?.nome_completo}</span>
                      {p.presente && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Presente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-8">
          <Button variant="outline" className="flex-1" onClick={handleEdit} disabled={loading}>
            Editar
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1" 
            onClick={handleCancelar}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir Evento"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
