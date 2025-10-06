import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, CheckCircle2, Navigation, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Ponto {
  id: string;
  ordem: number;
  eleitor_id: string;
  endereco_manual: string | null;
  observacoes: string | null;
  visitado: boolean;
  visitado_em: string | null;
  eleitores: {
    nome_completo: string;
    endereco: string | null;
  } | null;
}

interface Roteiro {
  id: string;
  nome: string;
  data: string;
  hora_inicio: string | null;
  objetivo: string | null;
  status: string;
  distancia_total: number | null;
  endereco_partida: string | null;
  endereco_final: string | null;
}

interface RoteiroDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roteiroId: string | null;
  onRoteiroUpdated: () => void;
}

export const RoteiroDetailsSheet = ({
  open,
  onOpenChange,
  roteiroId,
  onRoteiroUpdated
}: RoteiroDetailsSheetProps) => {
  const { toast } = useToast();
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open && roteiroId) {
      fetchRoteiro();
      fetchPontos();
    }
  }, [open, roteiroId]);

  const fetchRoteiro = async () => {
    if (!roteiroId) return;

    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .eq('id', roteiroId)
      .single();

    if (error) {
      console.error('Erro ao buscar roteiro:', error);
      return;
    }

    setRoteiro(data);
  };

  const fetchPontos = async () => {
    if (!roteiroId) return;

    const { data, error } = await supabase
      .from('roteiro_pontos')
      .select('*, eleitores(nome_completo, endereco)')
      .eq('roteiro_id', roteiroId)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar pontos:', error);
      return;
    }

    setPontos(data || []);
  };

  const toggleVisitado = async (pontoId: string, visitado: boolean) => {
    const { error } = await supabase
      .from('roteiro_pontos')
      .update({
        visitado: !visitado,
        visitado_em: !visitado ? new Date().toISOString() : null
      })
      .eq('id', pontoId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o ponto',
        variant: 'destructive'
      });
      return;
    }

    // Recarregar pontos
    await fetchPontos();
    
    // Verificar se todas as paradas foram visitadas
    if (!visitado && roteiroId && roteiro) {
      const { data: pontosAtualizados } = await supabase
        .from('roteiro_pontos')
        .select('visitado, latitude, longitude, ordem')
        .eq('roteiro_id', roteiroId)
        .order('ordem');

      if (pontosAtualizados) {
        const todasVisitadas = pontosAtualizados.every(p => p.visitado);
        
        // Se todas as paradas foram visitadas, marcar roteiro como concluído e calcular distância final
        if (todasVisitadas) {
          try {
            // Recalcular rota e distância
            const coordinates = [];
            
            if (roteiro.endereco_partida) {
              // Buscar coordenadas do endereço de partida
              const { data: roteiroData } = await supabase
                .from('roteiros')
                .select('latitude_partida, longitude_partida, latitude_final, longitude_final')
                .eq('id', roteiroId)
                .single();
              
              if (roteiroData?.latitude_partida && roteiroData?.longitude_partida) {
                coordinates.push(`${roteiroData.longitude_partida},${roteiroData.latitude_partida}`);
              }
            }
            
            pontosAtualizados
              .filter(p => p.latitude && p.longitude)
              .forEach(ponto => {
                coordinates.push(`${ponto.longitude},${ponto.latitude}`);
              });
            
            if (roteiro.endereco_final) {
              const { data: roteiroData } = await supabase
                .from('roteiros')
                .select('latitude_final, longitude_final')
                .eq('id', roteiroId)
                .single();
              
              if (roteiroData?.latitude_final && roteiroData?.longitude_final) {
                coordinates.push(`${roteiroData.longitude_final},${roteiroData.latitude_final}`);
              }
            }

            let distanciaKm = null;
            let tempoMinutos = null;

            if (coordinates.length >= 2) {
              const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates.join(';')}?overview=full&geometries=geojson`;
              
              const routeResponse = await fetch(osrmUrl);
              
              if (routeResponse.ok) {
                const routeData = await routeResponse.json();
                
                if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
                  const route = routeData.routes[0];
                  distanciaKm = parseFloat((route.distance / 1000).toFixed(2));
                  tempoMinutos = Math.round(route.duration / 60);
                }
              }
            }

            // Atualizar roteiro como concluído e com distância/tempo
            await supabase
              .from('roteiros')
              .update({ 
                status: 'concluido',
                distancia_total: distanciaKm,
                tempo_estimado: tempoMinutos
              })
              .eq('id', roteiroId);
            
            await fetchRoteiro();
            
            toast({
              title: 'Roteiro concluído!',
              description: `Todas as paradas foram visitadas. ${distanciaKm ? `Distância percorrida: ${distanciaKm} km` : ''}`,
            });
          } catch (error) {
            console.error('Erro ao calcular distância final:', error);
            // Marcar como concluído mesmo se o cálculo falhar
            await supabase
              .from('roteiros')
              .update({ status: 'concluido' })
              .eq('id', roteiroId);
            
            await fetchRoteiro();
            
            toast({
              title: 'Roteiro concluído!',
              description: 'Todas as paradas foram visitadas.',
            });
          }
        }
      }
    }
    
    onRoteiroUpdated();
  };

  const handleDelete = async () => {
    if (!roteiroId) return;

    setLoading(true);
    const { error } = await supabase
      .from('roteiros')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', roteiroId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o roteiro',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Roteiro excluído com sucesso'
    });

    setShowDeleteDialog(false);
    onOpenChange(false);
    onRoteiroUpdated();
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planejado: 'secondary',
      em_andamento: 'default',
      concluido: 'outline',
      cancelado: 'destructive'
    };

    const labels: Record<string, string> = {
      planejado: 'Planejado',
      em_andamento: 'Em Andamento',
      concluido: '✓ Concluído',
      cancelado: 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className={status === 'concluido' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (!roteiro) return null;

  const visitados = pontos.filter(p => p.visitado).length;
  const progresso = pontos.length > 0 ? (visitados / pontos.length) * 100 : 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{roteiro.nome}</SheetTitle>
            <SheetDescription>
              {format(new Date(roteiro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {roteiro.hora_inicio && ` às ${roteiro.hora_inicio}`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(roteiro.status)}
              <div className="text-sm text-muted-foreground">
                {visitados} de {pontos.length} visitados ({progresso.toFixed(0)}%)
              </div>
            </div>

            {(roteiro.endereco_partida || roteiro.endereco_final) && (
              <div className="grid grid-cols-2 gap-4">
                {roteiro.endereco_partida && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Partida</h4>
                    <p className="text-sm text-muted-foreground">{roteiro.endereco_partida}</p>
                  </div>
                )}
                {roteiro.endereco_final && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Destino Final</h4>
                    <p className="text-sm text-muted-foreground">{roteiro.endereco_final}</p>
                  </div>
                )}
              </div>
            )}

            {roteiro.objetivo && (
              <div>
                <h4 className="text-sm font-medium mb-2">Objetivo</h4>
                <p className="text-sm text-muted-foreground">{roteiro.objetivo}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-3">Locais ({pontos.length})</h4>
              <div className="space-y-2">
                {pontos.map((ponto) => (
                  <div
                    key={ponto.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      ponto.visitado ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {ponto.ordem}
                          </span>
                          <span className="font-medium">
                            {ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}
                          </span>
                          {ponto.endereco_manual && (
                            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded">
                              📍 Endereço alternativo
                            </span>
                          )}
                        </div>
                        {(ponto.endereco_manual || ponto.eleitores?.endereco) && (
                          <p className="text-sm text-muted-foreground ml-8">
                            {ponto.endereco_manual || ponto.eleitores?.endereco}
                          </p>
                        )}
                        {ponto.observacoes && (
                          <p className="text-sm text-muted-foreground ml-8 mt-1">
                            {ponto.observacoes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={ponto.visitado ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleVisitado(ponto.id, ponto.visitado)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const firstPonto = pontos[0];
                  if (firstPonto) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${firstPonto.eleitores?.endereco}`,
                      '_blank'
                    );
                  }
                }}
              >
                <Navigation className="mr-2 h-4 w-4" />
                Iniciar Navegação
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir roteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O roteiro e todos os seus pontos serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};