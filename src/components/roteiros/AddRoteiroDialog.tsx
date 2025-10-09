import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X, Sparkles, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouteOptimizer } from '@/hooks/useRouteOptimizer';
import { RouteTimeline } from './RouteTimeline';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roteiroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data: z.string().min(1, 'Data é obrigatória'),
  hora_inicio: z.string().optional(),
  objetivo: z.string().optional(),
  endereco_partida: z.string().optional(),
  endereco_final: z.string().optional()
});

type RoteiroFormData = z.infer<typeof roteiroSchema>;

interface PontoComEndereco {
  id: string;
  eleitor: Eleitor;
  endereco_alternativo: string;
  observacoes?: string;
}

interface Eleitor {
  id: string;
  nome_completo: string;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Assessor {
  user_id: string;
  profiles: {
    nome_completo: string;
  };
}

interface AddRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoteiroAdded: () => void;
}

export const AddRoteiroDialog = ({
  open,
  onOpenChange,
  onRoteiroAdded
}: AddRoteiroDialogProps) => {
  const { currentGabinete } = useGabinete();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [assessores, setAssessores] = useState<Assessor[]>([]);
  const [selectedEleitores, setSelectedEleitores] = useState<Eleitor[]>([]);
  const [selectedAssessores, setSelectedAssessores] = useState<string[]>([]);
  const [pontosComEndereco, setPontosComEndereco] = useState<PontoComEndereco[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTypeManual, setSearchTypeManual] = useState<"nome" | "cidade" | "bairro" | "endereco">("nome");
  const [searchTypeAssistant, setSearchTypeAssistant] = useState<"nome" | "cidade" | "bairro" | "endereco">("nome");
  const [searchResponsavel, setSearchResponsavel] = useState('');
  const [showEnderecoForm, setShowEnderecoForm] = useState(false);
  const [showEnderecoFormAssistente, setShowEnderecoFormAssistente] = useState(false);
  const [selectedEleitorForEndereco, setSelectedEleitorForEndereco] = useState<Eleitor | null>(null);
  const [enderecoAlternativo, setEnderecoAlternativo] = useState('');
  const [enderecoAlternativoAssistente, setEnderecoAlternativoAssistente] = useState('');
  const [obsAlternativo, setObsAlternativo] = useState('');
  const [obsAlternativoAssistente, setObsAlternativoAssistente] = useState('');
  const [searchEleitorEndereco, setSearchEleitorEndereco] = useState('');
  const [searchEleitorEnderecoAssistente, setSearchEleitorEnderecoAssistente] = useState('');
  const [stopDurations, setStopDurations] = useState<Record<string, number>>({});
  const [bufferTravel, setBufferTravel] = useState(10);
  const [bufferStop, setBufferStop] = useState(5);
  const { optimizeRoute, isOptimizing, optimizationResult, clearOptimization } = useRouteOptimizer();

  const form = useForm<RoteiroFormData>({
    resolver: zodResolver(roteiroSchema),
    defaultValues: {
      nome: '',
      data: new Date().toISOString().split('T')[0],
      hora_inicio: '',
      objetivo: '',
      endereco_partida: '',
      endereco_final: ''
    }
  });

  useEffect(() => {
    if (open && currentGabinete) {
      fetchEleitores();
      fetchAssessores();
    }
  }, [open, currentGabinete]);

  const fetchEleitores = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from('eleitores')
      .select('id, nome_completo, endereco, bairro, cidade, latitude, longitude')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('nome_completo');

    if (error) {
      console.error('Erro ao buscar eleitores:', error);
      return;
    }

    setEleitores(data || []);
  };

  const fetchAssessores = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from('user_gabinetes')
      .select('user_id, profiles!inner(nome_completo)')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar assessores:', error);
      return;
    }

    setAssessores(data || []);
  };

  const toggleEleitor = (eleitor: Eleitor) => {
    setSelectedEleitores(prev => {
      const exists = prev.find(e => e.id === eleitor.id);
      if (exists) {
        return prev.filter(e => e.id !== eleitor.id);
      }
      return [...prev, eleitor];
    });
  };

  const toggleAssessor = (userId: string) => {
    setSelectedAssessores(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
    setSearchResponsavel('');
  };

  const filteredAssessores = assessores.filter(a =>
    a.profiles.nome_completo.toLowerCase().includes(searchResponsavel.toLowerCase())
  );

  const addPontoComEndereco = () => {
    if (!selectedEleitorForEndereco || !enderecoAlternativo) {
      toast({
        title: 'Atenção',
        description: 'Selecione um eleitor e informe o endereço alternativo',
        variant: 'destructive'
      });
      return;
    }

    const novoPonto: PontoComEndereco = {
      id: Math.random().toString(),
      eleitor: selectedEleitorForEndereco,
      endereco_alternativo: enderecoAlternativo,
      observacoes: obsAlternativo
    };

    setPontosComEndereco(prev => [...prev, novoPonto]);
    setSelectedEleitorForEndereco(null);
    setEnderecoAlternativo('');
    setObsAlternativo('');
    setSearchEleitorEndereco('');
    setShowEnderecoForm(false);
  };

  const removePontoComEndereco = (id: string) => {
    setPontosComEndereco(prev => prev.filter(p => p.id !== id));
    setStopDurations(prev => {
      const newDurations = { ...prev };
      delete newDurations[`alt_${id}`];
      return newDurations;
    });
  };

  const filteredEleitoresEndereco = eleitores.filter(e =>
    e.nome_completo.toLowerCase().includes(searchEleitorEndereco.toLowerCase()) ||
    (e.endereco && e.endereco.toLowerCase().includes(searchEleitorEndereco.toLowerCase()))
  );

  const filteredEleitoresEnderecoAssistente = eleitores.filter(e =>
    e.nome_completo.toLowerCase().includes(searchEleitorEnderecoAssistente.toLowerCase()) ||
    (e.endereco && e.endereco.toLowerCase().includes(searchEleitorEnderecoAssistente.toLowerCase()))
  );

  const filteredEleitores = eleitores.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    switch (searchTypeManual) {
      case "nome":
        return e.nome_completo.toLowerCase().includes(searchLower);
      case "cidade":
        return e.cidade?.toLowerCase().includes(searchLower);
      case "bairro":
        return e.bairro?.toLowerCase().includes(searchLower);
      case "endereco":
        return e.endereco?.toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  const filteredEleitoresAssistant = eleitores.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    switch (searchTypeAssistant) {
      case "nome":
        return e.nome_completo.toLowerCase().includes(searchLower);
      case "cidade":
        return e.cidade?.toLowerCase().includes(searchLower);
      case "bairro":
        return e.bairro?.toLowerCase().includes(searchLower);
      case "endereco":
        return e.endereco?.toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  const handleOptimize = async () => {
    const formData = form.getValues();
    
    if (!formData.hora_inicio || !formData.endereco_partida) {
      toast({
        title: 'Atenção',
        description: 'Preencha a hora de início e o endereço de partida para otimizar',
        variant: 'destructive'
      });
      return;
    }

    if (selectedEleitores.length === 0 && pontosComEndereco.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma parada para otimizar',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Geocodificar origem se necessário
      let originLat, originLng;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.endereco_partida)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'GabineteApp/1.0' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          originLat = parseFloat(data[0].lat);
          originLng = parseFloat(data[0].lon);
        }
      }

      if (!originLat || !originLng) {
        toast({
          title: 'Erro',
          description: 'Não foi possível localizar o endereço de partida',
          variant: 'destructive'
        });
        return;
      }

      // Geocodificar endereços alternativos
      const pontosComCoordenadas = await Promise.all(
        pontosComEndereco.map(async (p) => {
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(p.endereco_alternativo)}&format=json&limit=1`,
              { headers: { 'User-Agent': 'GabineteApp/1.0' } }
            );
            
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData && geoData.length > 0) {
                return {
                  id: `alt_${p.id}`,
                  lat: parseFloat(geoData[0].lat),
                  lng: parseFloat(geoData[0].lon),
                  duration: stopDurations[`alt_${p.id}`] || 30,
                  address: `${p.eleitor.nome_completo} - ${p.endereco_alternativo}`,
                  eleitor_id: p.eleitor.id
                };
              }
            }
            
            // Fallback: usar coordenadas do eleitor
            return {
              id: `alt_${p.id}`,
              lat: p.eleitor.latitude!,
              lng: p.eleitor.longitude!,
              duration: stopDurations[`alt_${p.id}`] || 30,
              address: `${p.eleitor.nome_completo} - ${p.endereco_alternativo}`,
              eleitor_id: p.eleitor.id
            };
          } catch {
            // Em caso de erro, usar coordenadas do eleitor
            return {
              id: `alt_${p.id}`,
              lat: p.eleitor.latitude!,
              lng: p.eleitor.longitude!,
              duration: stopDurations[`alt_${p.id}`] || 30,
              address: `${p.eleitor.nome_completo} - ${p.endereco_alternativo}`,
              eleitor_id: p.eleitor.id
            };
          }
        })
      );

      // Preparar paradas
      const stops = [
        ...selectedEleitores.map(e => ({
          id: e.id,
          lat: e.latitude!,
          lng: e.longitude!,
          duration: stopDurations[e.id] || 30,
          address: `${e.nome_completo} - ${e.endereco || ''}`.trim(),
          eleitor_id: e.id
        })),
        ...pontosComCoordenadas
      ];

      await optimizeRoute({
        origin: {
          lat: originLat,
          lng: originLng,
          address: formData.endereco_partida
        },
        startTime: formData.hora_inicio,
        startDate: formData.data,
        stops,
        bufferTravel,
        bufferStop,
        returnLimit: undefined,
        considerTraffic: true
      });
    } catch (error) {
      console.error('Error optimizing:', error);
    }
  };

  const onSubmit = async (data: RoteiroFormData) => {
    if (!currentGabinete || !user) {
      toast({
        title: 'Erro',
        description: 'Usuário ou gabinete não identificado',
        variant: 'destructive'
      });
      return;
    }

    if (selectedEleitores.length === 0 && pontosComEndereco.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos um eleitor ao roteiro',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Geocodificar endereço de partida
      let latitudePartida = null;
      let longitudePartida = null;
      if (data.endereco_partida) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(data.endereco_partida)}` +
            `&format=json&limit=1`,
            {
              headers: {
                'User-Agent': 'GabineteApp/1.0'
              }
            }
          );

          if (response.ok) {
            const geocodeData = await response.json();
            if (geocodeData && geocodeData.length > 0) {
              latitudePartida = parseFloat(geocodeData[0].lat);
              longitudePartida = parseFloat(geocodeData[0].lon);
            }
          }
        } catch (error) {
          console.error('Erro ao geocodificar endereço de partida:', error);
        }
      }

      // Geocodificar endereço final
      let latitudeFinal = null;
      let longitudeFinal = null;
      if (data.endereco_final) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(data.endereco_final)}` +
            `&format=json&limit=1`,
            {
              headers: {
                'User-Agent': 'GabineteApp/1.0'
              }
            }
          );

          if (response.ok) {
            const geocodeData = await response.json();
            if (geocodeData && geocodeData.length > 0) {
              latitudeFinal = parseFloat(geocodeData[0].lat);
              longitudeFinal = parseFloat(geocodeData[0].lon);
            }
          }
        } catch (error) {
          console.error('Erro ao geocodificar endereço final:', error);
        }
      }

      const { data: roteiro, error: roteiroError } = await supabase
        .from('roteiros')
        .insert({
          gabinete_id: currentGabinete.gabinete_id,
          nome: data.nome,
          data: data.data,
          hora_inicio: data.hora_inicio || null,
          objetivo: data.objetivo || null,
          endereco_partida: data.endereco_partida || null,
          endereco_final: data.endereco_final || null,
          latitude_partida: latitudePartida,
          longitude_partida: longitudePartida,
          latitude_final: latitudeFinal,
          longitude_final: longitudeFinal,
          criado_por: user.id,
          status: 'planejado'
        })
        .select()
        .single();

      if (roteiroError) throw roteiroError;

      // Se houver resultado de otimização, usar a ordem e ETAs otimizados
      let todosPontos;
      if (optimizationResult && optimizationResult.optimizedStops) {
        todosPontos = optimizationResult.optimizedStops.map((stop, index) => {
          const eleitorId = stop.eleitor_id;
          return {
            roteiro_id: roteiro.id,
            ordem: stop.order,
            eleitor_id: eleitorId,
            endereco_manual: stop.address.includes(' - ') ? stop.address.split(' - ')[1] : null,
            latitude: stop.lat,
            longitude: stop.lng,
            duracao_prevista_minutos: stop.duration,
            eta_chegada: stop.etaArrival,
            eta_inicio_atendimento: stop.etaStart,
            eta_fim_atendimento: stop.etaEnd,
            tempo_deslocamento_minutos: stop.travelTimeMinutes,
            conflito_janela: stop.conflictWindow || false,
            atraso_minutos: stop.delayMinutes || 0,
            observacoes: null
          };
        });
      } else {
        // Usar ordem manual
        const pontosEleitores = selectedEleitores.map((eleitor, index) => ({
          roteiro_id: roteiro.id,
          ordem: index + 1,
          eleitor_id: eleitor.id,
          endereco_manual: null,
          latitude: eleitor.latitude,
          longitude: eleitor.longitude,
          duracao_prevista_minutos: stopDurations[eleitor.id] || 30,
          observacoes: `${eleitor.endereco || ''}, ${eleitor.bairro || ''}`
        }));

        // Geocodificar endereços alternativos
        const pontosComEnderecoAlternativo = await Promise.all(
          pontosComEndereco.map(async (ponto, index) => {
            let latitude = null;
            let longitude = null;

            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(ponto.endereco_alternativo)}` +
                `&format=json&limit=1`,
                { headers: { 'User-Agent': 'GabineteApp/1.0' } }
              );

              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                  latitude = parseFloat(data[0].lat);
                  longitude = parseFloat(data[0].lon);
                }
              }
            } catch (error) {
              console.error('Erro ao geocodificar endereço alternativo:', error);
            }

            return {
              roteiro_id: roteiro.id,
              ordem: selectedEleitores.length + index + 1,
              eleitor_id: ponto.eleitor.id,
              endereco_manual: ponto.endereco_alternativo,
              latitude,
              longitude,
              duracao_prevista_minutos: stopDurations[`alt_${ponto.id}`] || 30,
              observacoes: ponto.observacoes || null
            };
          })
        );

        todosPontos = [...pontosEleitores, ...pontosComEnderecoAlternativo];
      }

      const { error: pontosError } = await supabase
        .from('roteiro_pontos')
        .insert(todosPontos);

      if (pontosError) throw pontosError;

      // Calcular rota completa e distância usando OSRM
      if (todosPontos.length > 0) {
        try {
          // Criar array de coordenadas: partida -> pontos -> final
          const coordinates = [];
          
          if (latitudePartida && longitudePartida) {
            coordinates.push(`${longitudePartida},${latitudePartida}`);
          }
          
          todosPontos
            .sort((a, b) => a.ordem - b.ordem)
            .forEach(ponto => {
              if (ponto.latitude && ponto.longitude) {
                coordinates.push(`${ponto.longitude},${ponto.latitude}`);
              }
            });
          
          if (latitudeFinal && longitudeFinal) {
            coordinates.push(`${longitudeFinal},${latitudeFinal}`);
          }

          if (coordinates.length >= 2) {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates.join(';')}?overview=full&geometries=geojson`;
            
            const routeResponse = await fetch(osrmUrl);
            
            if (routeResponse.ok) {
              const routeData = await routeResponse.json();
              
              if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
                const route = routeData.routes[0];
                const distanciaKm = (route.distance / 1000).toFixed(2);
                const tempoMinutos = Math.round(route.duration / 60);
                
                // Atualizar roteiro com distância e tempo
                await supabase
                  .from('roteiros')
                  .update({
                    distancia_total: parseFloat(distanciaKm),
                    tempo_estimado: tempoMinutos
                  })
                  .eq('id', roteiro.id);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao calcular rota:', error);
          // Não falha o processo se a rota não puder ser calculada
        }
      }

      // Salvar responsáveis do roteiro
      if (selectedAssessores.length > 0) {
        const responsaveis = selectedAssessores.map(userId => ({
          roteiro_id: roteiro.id,
          user_id: userId
        }));

        const { error: responsaveisError } = await supabase
          .from('roteiro_responsaveis')
          .insert(responsaveis);

        if (responsaveisError) {
          console.error('Erro ao salvar responsáveis:', responsaveisError);
          // Não falha a criação do roteiro por causa disso
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Roteiro criado com sucesso!'
      });

      form.reset();
      setSelectedEleitores([]);
      setSelectedAssessores([]);
      setPontosComEndereco([]);
      setSearchTerm('');
      setSearchResponsavel('');
      onOpenChange(false);
      onRoteiroAdded();
    } catch (error) {
      console.error('Erro ao criar roteiro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o roteiro',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Roteiro</DialogTitle>
          <DialogDescription>
            Planeje um roteiro de visitas com os locais em sequência
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Criar Manualmente</TabsTrigger>
                <TabsTrigger value="assistant">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Assistente Inteligente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Roteiro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Visitas Bairro Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endereco_partida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço de Partida</FormLabel>
                  <FormControl>
                    <Input placeholder="De onde você vai sair" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_final"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Final</FormLabel>
                  <FormControl>
                    <Input placeholder="Onde você vai terminar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo / Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Revisar demandas de iluminação pública"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Responsáveis */}
            <div className="space-y-2">
              <FormLabel>Responsáveis ({selectedAssessores.length})</FormLabel>
              
              {selectedAssessores.length > 0 && (
                <div className="space-y-1 mb-2">
                  {selectedAssessores.map((userId) => {
                    const assessor = assessores.find(a => a.user_id === userId);
                    if (!assessor) return null;
                    return (
                      <div
                        key={userId}
                        className="flex items-center justify-between p-2 bg-primary/10 rounded-md text-sm"
                      >
                        <div className="font-medium">{assessor.profiles.nome_completo}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAssessor(userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Input
                placeholder="Buscar responsável por nome..."
                value={searchResponsavel}
                onChange={(e) => setSearchResponsavel(e.target.value)}
              />

              {searchResponsavel.length >= 2 && (
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {filteredAssessores.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum assessor encontrado
                    </p>
                  ) : (
                    filteredAssessores.map((assessor) => {
                      const isSelected = selectedAssessores.includes(assessor.user_id);
                      return (
                        <button
                          key={assessor.user_id}
                          type="button"
                          onClick={() => toggleAssessor(assessor.user_id)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="font-medium">{assessor.profiles.nome_completo}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Locais do Roteiro ({selectedEleitores.length + pontosComEndereco.length})</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEnderecoForm(!showEnderecoForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Endereço Alternativo
                </Button>
              </div>

              {showEnderecoForm && (
                <div className="p-3 border rounded-md space-y-2 bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecione um eleitor e informe onde ele será encontrado
                  </p>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar eleitor por nome..."
                      value={searchEleitorEndereco}
                      onChange={(e) => {
                        setSearchEleitorEndereco(e.target.value);
                        setSelectedEleitorForEndereco(null);
                      }}
                    />
                    
                    {searchEleitorEndereco.length >= 2 && (
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredEleitoresEndereco.slice(0, 20).map(eleitor => {
                          const isSelected = selectedEleitorForEndereco?.id === eleitor.id;
                          return (
                            <button
                              key={eleitor.id}
                              type="button"
                              onClick={() => {
                                setSelectedEleitorForEndereco(eleitor);
                                setSearchEleitorEndereco(eleitor.nome_completo);
                              }}
                              className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="font-medium">{eleitor.nome_completo}</div>
                              <div className="text-xs opacity-75">
                                {eleitor.endereco || 'Sem endereço cadastrado'}
                              </div>
                            </button>
                          );
                        })}
                        {filteredEleitoresEndereco.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center p-2">
                            Nenhum eleitor encontrado
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedEleitorForEndereco && (
                      <div className="p-2 bg-primary/10 rounded-md text-sm">
                        <strong>Selecionado:</strong> {selectedEleitorForEndereco.nome_completo}
                      </div>
                    )}
                  </div>

                  <Input
                    placeholder="Endereço onde encontrará esta pessoa"
                    value={enderecoAlternativo}
                    onChange={(e) => setEnderecoAlternativo(e.target.value)}
                  />
                  <Textarea
                    placeholder="Observações (opcional)"
                    value={obsAlternativo}
                    onChange={(e) => setObsAlternativo(e.target.value)}
                    rows={2}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addPontoComEndereco}
                    className="w-full"
                    disabled={!selectedEleitorForEndereco || !enderecoAlternativo}
                  >
                    Adicionar ao Roteiro
                  </Button>
                </div>
              )}
              
              {(selectedEleitores.length > 0 || pontosComEndereco.length > 0) && (
                <div className="space-y-1 mb-2">
                  {selectedEleitores.map((eleitor, index) => (
                    <div
                      key={eleitor.id}
                      className="flex items-center justify-between p-2 bg-primary/10 rounded-md text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {index + 1}. {eleitor.nome_completo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {eleitor.endereco || 'Sem endereço cadastrado'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEleitor(eleitor)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {pontosComEndereco.map((ponto, index) => (
                    <div
                      key={ponto.id}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded-md text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {selectedEleitores.length + index + 1}. {ponto.eleitor.nome_completo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          📍 {ponto.endereco_alternativo}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePontoComEndereco(ponto.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={searchTypeManual} onValueChange={(value: any) => setSearchTypeManual(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="cidade">Cidade</SelectItem>
                    <SelectItem value="bairro">Bairro</SelectItem>
                    <SelectItem value="endereco">Rua</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={`Buscar por ${searchTypeManual}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                {filteredEleitores.slice(0, 20).map(eleitor => {
                  const isSelected = selectedEleitores.find(e => e.id === eleitor.id);
                  return (
                    <button
                      key={eleitor.id}
                      type="button"
                      onClick={() => toggleEleitor(eleitor)}
                      className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{eleitor.nome_completo}</div>
                      <div className="text-xs opacity-75">
                        {eleitor.endereco || 'Sem endereço'} - {eleitor.bairro || ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Roteiro
              </Button>
            </div>
              </TabsContent>

              <TabsContent value="assistant" className="space-y-4 mt-4">
                <Card className="p-4 bg-primary/5">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Assistente Inteligente de Roteiros</h4>
                      <p className="text-sm text-muted-foreground">
                        Otimiza automaticamente a ordem das visitas, calcula ETAs, respeita janelas de tempo e sugere o melhor percurso.
                      </p>
                    </div>
                  </div>
                </Card>

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Roteiro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Visitas Bairro Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Saída *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="endereco_partida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço de Partida *</FormLabel>
                      <FormControl>
                        <Input placeholder="De onde você vai sair" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Buffer Deslocamento (min)</FormLabel>
                    <Input
                      type="number"
                      value={bufferTravel}
                      onChange={(e) => setBufferTravel(Number(e.target.value))}
                      min="0"
                      max="60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo extra para estacionar/trânsito
                    </p>
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Buffer por Parada (min)</FormLabel>
                    <Input
                      type="number"
                      value={bufferStop}
                      onChange={(e) => setBufferStop(Number(e.target.value))}
                      min="0"
                      max="30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo extra entre paradas
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Revisar demandas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>
                    Paradas ({selectedEleitores.length + pontosComEndereco.length})
                  </FormLabel>
                  
                  {(selectedEleitores.length > 0 || pontosComEndereco.length > 0) && (
                    <div className="space-y-2">
                      {selectedEleitores.map((eleitor) => (
                        <Card key={eleitor.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{eleitor.nome_completo}</p>
                              <p className="text-xs text-muted-foreground">{eleitor.endereco}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-20"
                                placeholder="30"
                                value={stopDurations[eleitor.id] || 30}
                                onChange={(e) =>
                                  setStopDurations(prev => ({
                                    ...prev,
                                    [eleitor.id]: Number(e.target.value)
                                  }))
                                }
                                min="5"
                                max="300"
                              />
                              <span className="text-xs text-muted-foreground">min</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEleitor(eleitor)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {pontosComEndereco.map((ponto) => (
                        <Card key={ponto.id} className="p-3 bg-secondary/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{ponto.eleitor.nome_completo}</p>
                              <p className="text-xs text-muted-foreground">
                                📍 {ponto.endereco_alternativo}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-20"
                                placeholder="30"
                                value={stopDurations[`alt_${ponto.id}`] || 30}
                                onChange={(e) =>
                                  setStopDurations(prev => ({
                                    ...prev,
                                    [`alt_${ponto.id}`]: Number(e.target.value)
                                  }))
                                }
                                min="5"
                                max="300"
                              />
                              <span className="text-xs text-muted-foreground">min</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePontoComEndereco(ponto.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Select value={searchTypeAssistant} onValueChange={(value: any) => setSearchTypeAssistant(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nome">Nome</SelectItem>
                        <SelectItem value="cidade">Cidade</SelectItem>
                        <SelectItem value="bairro">Bairro</SelectItem>
                        <SelectItem value="endereco">Rua</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`Buscar por ${searchTypeAssistant}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {searchTerm && (
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filteredEleitoresAssistant.slice(0, 20).map(eleitor => {
                        const isSelected = selectedEleitores.find(e => e.id === eleitor.id);
                        return (
                          <button
                            key={eleitor.id}
                            type="button"
                            onClick={() => toggleEleitor(eleitor)}
                            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{eleitor.nome_completo}</div>
                            <div className="text-xs opacity-75">
                              {eleitor.endereco || 'Sem endereço'} - {eleitor.bairro || ''}
                            </div>
                          </button>
                        );
                      })}
                     </div>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => setShowEnderecoFormAssistente(!showEnderecoFormAssistente)}
                     className="w-full"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     {showEnderecoFormAssistente ? 'Cancelar' : 'Adicionar Parada com Endereço Alternativo'}
                   </Button>

                   {showEnderecoFormAssistente && (
                     <div className="p-3 border rounded-md space-y-3 bg-muted/30">
                       <div className="space-y-2">
                         <FormLabel>Selecionar Pessoa</FormLabel>
                         <Input
                           placeholder="Buscar por nome..."
                           value={searchEleitorEnderecoAssistente}
                           onChange={(e) => setSearchEleitorEnderecoAssistente(e.target.value)}
                         />
                         
                         {searchEleitorEnderecoAssistente && (
                           <div className="max-h-40 overflow-y-auto border rounded-md p-1 space-y-1 bg-background">
                             {filteredEleitoresEnderecoAssistente.map(eleitor => {
                               const isSelected = selectedEleitorForEndereco?.id === eleitor.id;
                               return (
                                 <button
                                   key={eleitor.id}
                                   type="button"
                                   onClick={() => {
                                     setSelectedEleitorForEndereco(eleitor);
                                     setSearchEleitorEnderecoAssistente(eleitor.nome_completo);
                                   }}
                                   className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                     isSelected
                                       ? 'bg-primary text-primary-foreground'
                                       : 'hover:bg-muted'
                                   }`}
                                 >
                                   <div className="font-medium">{eleitor.nome_completo}</div>
                                   <div className="text-xs opacity-75">
                                     {eleitor.endereco || 'Sem endereço cadastrado'}
                                   </div>
                                 </button>
                               );
                             })}
                             {filteredEleitoresEnderecoAssistente.length === 0 && (
                               <p className="text-sm text-muted-foreground text-center p-2">
                                 Nenhum eleitor encontrado
                               </p>
                             )}
                           </div>
                         )}
                         
                         {selectedEleitorForEndereco && (
                           <div className="p-2 bg-primary/10 rounded-md text-sm">
                             <strong>Selecionado:</strong> {selectedEleitorForEndereco.nome_completo}
                           </div>
                         )}
                       </div>

                       <Input
                         placeholder="Endereço onde encontrará esta pessoa"
                         value={enderecoAlternativoAssistente}
                         onChange={(e) => setEnderecoAlternativoAssistente(e.target.value)}
                       />
                       <Textarea
                         placeholder="Observações (opcional)"
                         value={obsAlternativoAssistente}
                         onChange={(e) => setObsAlternativoAssistente(e.target.value)}
                         rows={2}
                       />
                       <Button
                         type="button"
                         size="sm"
                         onClick={() => {
                           if (!selectedEleitorForEndereco || !enderecoAlternativoAssistente) {
                             toast({
                               title: 'Atenção',
                               description: 'Selecione um eleitor e informe o endereço alternativo',
                               variant: 'destructive'
                             });
                             return;
                           }
                           
                           const novoPonto: PontoComEndereco = {
                             id: Math.random().toString(),
                             eleitor: selectedEleitorForEndereco,
                             endereco_alternativo: enderecoAlternativoAssistente,
                             observacoes: obsAlternativoAssistente
                           };
                           
                           setPontosComEndereco(prev => [...prev, novoPonto]);
                           setSelectedEleitorForEndereco(null);
                           setEnderecoAlternativoAssistente('');
                           setObsAlternativoAssistente('');
                           setSearchEleitorEnderecoAssistente('');
                           setShowEnderecoFormAssistente(false);
                         }}
                         className="w-full"
                         disabled={!selectedEleitorForEndereco || !enderecoAlternativoAssistente}
                       >
                         Adicionar Parada
                       </Button>
                     </div>
                   )}
                 </div>

                 {optimizationResult && optimizationResult.conflicts && optimizationResult.conflicts.length > 0 && (
                  <Card className="p-3 border-destructive/50 bg-destructive/5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-destructive mb-1">
                          Conflitos Detectados
                        </p>
                        <ul className="text-xs space-y-1">
                          {optimizationResult.conflicts.map((conflict, i) => (
                            <li key={i}>• {conflict}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

                {optimizationResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Timeline Otimizado</h4>
                      <Badge>
                        {optimizationResult.summary.totalDuration}h total
                      </Badge>
                    </div>
                    <RouteTimeline
                      startTime={form.getValues('hora_inicio')}
                      startAddress={form.getValues('endereco_partida')}
                      stops={optimizationResult.optimizedStops.map(s => ({
                        id: s.id,
                        order: s.order,
                        address: s.address,
                        duration: s.duration,
                        etaArrival: s.etaArrival,
                        etaStart: s.etaStart,
                        etaEnd: s.etaEnd,
                        travelTimeMinutes: s.travelTimeMinutes,
                        conflictWindow: s.conflictWindow,
                        delayMinutes: s.delayMinutes,
                        eleitor_id: s.eleitor_id
                      }))}
                      totalDistance={optimizationResult.totalDistance}
                    />
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      clearOptimization();
                      onOpenChange(false);
                    }}
                    disabled={loading || isOptimizing}
                  >
                    Cancelar
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleOptimize}
                      disabled={loading || isOptimizing}
                    >
                      {isOptimizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Sparkles className="mr-2 h-4 w-4" />
                      Otimizar Roteiro
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !optimizationResult}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Roteiro
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};