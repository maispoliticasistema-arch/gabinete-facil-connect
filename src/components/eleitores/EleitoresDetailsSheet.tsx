import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, MapPin, Calendar, User, FileText, Clock } from 'lucide-react';
import { DemandaDetailsSheet } from '@/components/demandas/DemandaDetailsSheet';

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  cpf: string | null;
  rg: string | null;
  profissao: string | null;
  observacoes: string | null;
  created_at: string;
}

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

interface Roteiro {
  id: string;
  nome: string;
  data: string;
  status: string;
  objetivo: string | null;
  roteiro_pontos: Array<{
    ordem: number;
    visitado: boolean;
    visitado_em: string | null;
  }>;
}

interface EleitoresDetailsSheetProps {
  eleitor: Eleitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EleitoresDetailsSheet = ({
  eleitor,
  open,
  onOpenChange,
}: EleitoresDetailsSheetProps) => {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoteiros, setLoadingRoteiros] = useState(false);
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [demandaSheetOpen, setDemandaSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && eleitor) {
      fetchDemandas();
      fetchRoteiros();
    }
  }, [open, eleitor]);

  const fetchDemandas = async () => {
    if (!eleitor) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demandas')
        .select('*, eleitores(nome_completo)')
        .eq('eleitor_id', eleitor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemandas((data || []) as unknown as Demanda[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoteiros = async () => {
    if (!eleitor) return;

    setLoadingRoteiros(true);
    try {
      const { data, error } = await supabase
        .from('roteiro_pontos')
        .select(`
          ordem,
          visitado,
          visitado_em,
          roteiros!inner(
            id,
            nome,
            data,
            status,
            objetivo
          )
        `)
        .eq('eleitor_id', eleitor.id)
        .order('roteiros(data)', { ascending: false });

      if (error) throw error;
      
      // Transformar os dados para agrupar por roteiro
      const roteirosMap = new Map();
      (data || []).forEach((item: any) => {
        const roteiro = item.roteiros;
        if (!roteirosMap.has(roteiro.id)) {
          roteirosMap.set(roteiro.id, {
            ...roteiro,
            roteiro_pontos: []
          });
        }
        roteirosMap.get(roteiro.id).roteiro_pontos.push({
          ordem: item.ordem,
          visitado: item.visitado,
          visitado_em: item.visitado_em
        });
      });

      setRoteiros(Array.from(roteirosMap.values()));
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar roteiros',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingRoteiros(false);
    }
  };

  const handleDemandaClick = (demanda: Demanda) => {
    setSelectedDemanda(demanda);
    setDemandaSheetOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
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

  const getStatusRoteiroColor = (status: string) => {
    const colors: Record<string, string> = {
      planejado: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluido: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!eleitor) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(eleitor.nome_completo)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle>{eleitor.nome_completo}</SheetTitle>
                <SheetDescription>Informações completas e histórico de demandas</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Informações de Contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contato</h3>
              <div className="grid gap-3">
                {eleitor.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{eleitor.telefone}</span>
                  </div>
                )}
                {eleitor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{eleitor.email}</span>
                  </div>
                )}
                {!eleitor.telefone && !eleitor.email && (
                  <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informações Pessoais</h3>
              <div className="grid gap-3 text-sm">
                {eleitor.data_nascimento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Data de Nascimento:</span>
                    <span>{formatDate(eleitor.data_nascimento)}</span>
                  </div>
                )}
                {eleitor.cpf && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CPF:</span>
                    <span>{eleitor.cpf}</span>
                  </div>
                )}
                {eleitor.rg && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">RG:</span>
                    <span>{eleitor.rg}</span>
                  </div>
                )}
                {eleitor.profissao && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Profissão:</span>
                    <span>{eleitor.profissao}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Endereço</h3>
              {eleitor.endereco || eleitor.cidade ? (
                <div className="grid gap-2 text-sm">
                  {eleitor.endereco && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>
                          {eleitor.endereco}
                          {eleitor.numero && `, ${eleitor.numero}`}
                        </p>
                        {eleitor.bairro && <p className="text-muted-foreground">{eleitor.bairro}</p>}
                        {(eleitor.cidade || eleitor.estado) && (
                          <p className="text-muted-foreground">
                            {[eleitor.cidade, eleitor.estado].filter(Boolean).join(' - ')}
                          </p>
                        )}
                        {eleitor.cep && <p className="text-muted-foreground">CEP: {eleitor.cep}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
              )}
            </div>

            {eleitor.observacoes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Observações</h3>
                  <p className="text-sm text-muted-foreground">{eleitor.observacoes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Histórico de Roteiros e Visitas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Roteiros e Visitas</h3>
                <Badge variant="secondary">{roteiros.length}</Badge>
              </div>

              {loadingRoteiros ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : roteiros.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum roteiro registrado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {roteiros.map((roteiro) => {
                    const ponto = roteiro.roteiro_pontos[0];
                    return (
                      <div
                        key={roteiro.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium line-clamp-1">{roteiro.nome}</h4>
                            <Badge className={getStatusRoteiroColor(roteiro.status)} variant="secondary">
                              {roteiro.status === 'planejado' ? 'Planejado' :
                               roteiro.status === 'em_andamento' ? 'Em Andamento' :
                               roteiro.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                            </Badge>
                          </div>
                          {roteiro.objetivo && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {roteiro.objetivo}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(roteiro.data)}
                            </div>
                            {ponto.visitado && (
                              <Badge className="bg-green-100 text-green-800" variant="secondary">
                                ✓ Visitado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Histórico de Demandas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Histórico de Demandas</h3>
                <Badge variant="secondary">{demandas.length}</Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : demandas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma demanda registrada ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {demandas.map((demanda) => (
                    <div
                      key={demanda.id}
                      onClick={() => handleDemandaClick(demanda)}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium line-clamp-1">{demanda.titulo}</h4>
                          <div className="flex gap-1 shrink-0">
                            <Badge className={getStatusColor(demanda.status)} variant="secondary">
                              {demanda.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        {demanda.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {demanda.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Badge
                              className={getPrioridadeColor(demanda.prioridade)}
                              variant="secondary"
                            >
                              {demanda.prioridade}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(demanda.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
              <Calendar className="h-3 w-3" />
              <span>Cadastrado em {formatDate(eleitor.created_at)}</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de detalhes da demanda */}
      <DemandaDetailsSheet
        demanda={selectedDemanda}
        open={demandaSheetOpen}
        onOpenChange={setDemandaSheetOpen}
        onDemandaUpdated={fetchDemandas}
      />
    </>
  );
};
