import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/notifications';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  created_at: string;
  concluida_em: string | null;
  eleitores: {
    nome_completo: string;
  } | null;
  responsavel_id: string | null;
}

interface UserGabinete {
  user_id: string;
  role: string;
  profiles: {
    nome_completo: string;
  };
}

interface Comentario {
  id: string;
  user_id: string;
  comentario: string;
  tipo: string;
  created_at: string;
  profiles?: {
    nome_completo: string;
  };
}

interface DemandaDetailsSheetProps {
  demanda: Demanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDemandaUpdated: () => void;
}

export const DemandaDetailsSheet = ({
  demanda,
  open,
  onOpenChange,
  onDemandaUpdated,
}: DemandaDetailsSheetProps) => {
  const [assessores, setAssessores] = useState<UserGabinete[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedResponsavel, setSelectedResponsavel] = useState('');
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();
  const { user } = useAuth();

  useEffect(() => {
    if (open && currentGabinete && demanda) {
      fetchAssessores();
      fetchComentarios();
      setSelectedStatus(demanda.status);
      setSelectedResponsavel(demanda.responsavel_id || '');
    }
  }, [open, currentGabinete, demanda]);

  const fetchAssessores = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('user_gabinetes')
        .select('user_id, role, profiles(nome_completo)')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .eq('ativo', true);

      if (error) throw error;
      setAssessores((data || []) as unknown as UserGabinete[]);
    } catch (error: any) {
      console.error('Erro ao carregar assessores:', error);
    }
  };

  const fetchComentarios = async () => {
    if (!demanda) return;

    try {
      const { data, error } = await supabase
        .from('demanda_comentarios')
        .select('*, profiles(nome_completo)')
        .eq('demanda_id', demanda.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComentarios((data || []) as unknown as Comentario[]);
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!demanda || !user) return;

    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
      };

      // Se marcar como concluída, registrar data
      if (newStatus === 'concluida') {
        updateData.concluida_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from('demandas')
        .update(updateData)
        .eq('id', demanda.id);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('demanda_comentarios').insert({
        demanda_id: demanda.id,
        user_id: user.id,
        comentario: `Status alterado para: ${newStatus.replace('_', ' ')}`,
        tipo: 'status_change',
      });

      // Notificar responsável se houver e não for o próprio usuário
      if (demanda.responsavel_id && demanda.responsavel_id !== user.id && currentGabinete) {
        await createNotification({
          userId: demanda.responsavel_id,
          gabineteId: currentGabinete.gabinete_id,
          type: newStatus === 'concluida' ? 'demanda_concluida' : 'demanda_atualizada',
          title: newStatus === 'concluida' ? 'Demanda concluída' : 'Status de demanda alterado',
          message: `A demanda "${demanda.titulo}" foi ${newStatus === 'concluida' ? 'marcada como concluída' : `alterada para: ${newStatus.replace('_', ' ')}`}`,
          entityType: 'demanda',
          entityId: demanda.id,
        });
      }

      setSelectedStatus(newStatus);
      fetchComentarios();
      onDemandaUpdated();

      toast({
        title: 'Status atualizado',
        description: 'O status da demanda foi alterado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponsavelChange = async (newResponsavel: string) => {
    if (!demanda || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('demandas')
        .update({ responsavel_id: newResponsavel })
        .eq('id', demanda.id);

      if (error) throw error;

      const responsavelNome =
        assessores.find((a) => a.user_id === newResponsavel)?.profiles.nome_completo || '';

      // Registrar no histórico
      await supabase.from('demanda_comentarios').insert({
        demanda_id: demanda.id,
        user_id: user.id,
        comentario: `Responsável alterado para: ${responsavelNome}`,
        tipo: 'responsavel_change',
      });

      // Notificar novo responsável se não for o próprio usuário
      if (newResponsavel !== user.id && currentGabinete) {
        await createNotification({
          userId: newResponsavel,
          gabineteId: currentGabinete.gabinete_id,
          type: 'demanda_atribuida',
          title: 'Você foi designado responsável',
          message: `Você foi designado(a) como responsável pela demanda: "${demanda.titulo}"`,
          entityType: 'demanda',
          entityId: demanda.id,
        });
      }

      // Notificar responsável anterior se houver e não for o próprio usuário
      if (demanda.responsavel_id && demanda.responsavel_id !== user.id && demanda.responsavel_id !== newResponsavel && currentGabinete) {
        await createNotification({
          userId: demanda.responsavel_id,
          gabineteId: currentGabinete.gabinete_id,
          type: 'demanda_atualizada',
          title: 'Responsável de demanda alterado',
          message: `A demanda "${demanda.titulo}" foi reatribuída para ${responsavelNome}`,
          entityType: 'demanda',
          entityId: demanda.id,
        });
      }

      setSelectedResponsavel(newResponsavel);
      fetchComentarios();
      onDemandaUpdated();

      toast({
        title: 'Responsável atualizado',
        description: 'O responsável da demanda foi alterado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar responsável',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComentario = async () => {
    if (!demanda || !user || !novoComentario.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('demanda_comentarios').insert({
        demanda_id: demanda.id,
        user_id: user.id,
        comentario: novoComentario,
        tipo: 'comentario',
      });

      if (error) throw error;

      // Notificar responsável se houver e não for o próprio usuário
      if (demanda.responsavel_id && demanda.responsavel_id !== user.id && currentGabinete) {
        await createNotification({
          userId: demanda.responsavel_id,
          gabineteId: currentGabinete.gabinete_id,
          type: 'demanda_comentario',
          title: 'Novo comentário em demanda',
          message: `Novo comentário na demanda "${demanda.titulo}": ${novoComentario.substring(0, 50)}${novoComentario.length > 50 ? '...' : ''}`,
          entityType: 'demanda',
          entityId: demanda.id,
        });
      }

      setNovoComentario('');
      fetchComentarios();

      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi registrado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar comentário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberta: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors: Record<string, string> = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'status_change') return <AlertCircle className="h-4 w-4" />;
    if (tipo === 'responsavel_change') return <User className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  if (!demanda) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{demanda.titulo}</SheetTitle>
          <SheetDescription>Detalhes e histórico da demanda</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(demanda.status)} variant="secondary">
                {selectedStatus.replace('_', ' ')}
              </Badge>
              <Badge className={getPrioridadeColor(demanda.prioridade)} variant="secondary">
                {demanda.prioridade}
              </Badge>
            </div>

            {demanda.descricao && (
              <div>
                <p className="text-sm font-medium mb-1">Descrição</p>
                <p className="text-sm text-muted-foreground">{demanda.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Eleitor</p>
                  <p className="font-medium">{demanda.eleitores?.nome_completo || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                  <p className="font-medium">{formatDateOnly(demanda.prazo)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criada em</p>
                  <p className="font-medium">{formatDateOnly(demanda.created_at)}</p>
                </div>
              </div>

              {demanda.concluida_em && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Concluída em</p>
                    <p className="font-medium">{formatDateOnly(demanda.concluida_em)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Alterar Status e Responsável */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Gerenciar Demanda</h3>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <Select
                value={selectedResponsavel}
                onValueChange={handleResponsavelChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {assessores.map((assessor) => (
                    <SelectItem key={assessor.user_id} value={assessor.user_id}>
                      {assessor.profiles.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Histórico e Comentários */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Histórico e Atualizações</h3>

            <div className="space-y-3">
              {comentarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atualização ainda
                </p>
              ) : (
                comentarios.map((comentario) => (
                  <div key={comentario.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(comentario.profiles?.nome_completo || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(comentario.tipo)}
                        <p className="text-sm font-medium">
                          {comentario.profiles?.nome_completo || 'Usuário'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comentario.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comentario.comentario}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Adicionar Comentário */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Adicionar Comentário</label>
              <Textarea
                placeholder="Digite uma atualização ou comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <Button
                onClick={handleAddComentario}
                disabled={loading || !novoComentario.trim()}
                className="w-full"
              >
                Adicionar Comentário
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};