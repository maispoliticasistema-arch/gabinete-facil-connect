import { useState, useEffect, useMemo } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, NoPermissionMessage } from '@/components/PermissionGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Map } from 'lucide-react';
import { RoteirosStats } from '@/components/roteiros/RoteirosStats';
import { AddRoteiroDialog } from '@/components/roteiros/AddRoteiroDialog';
import { RoteiroDetailsSheet } from '@/components/roteiros/RoteiroDetailsSheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Roteiro {
  id: string;
  nome: string;
  data: string;
  hora_inicio: string | null;
  status: string;
  objetivo: string | null;
  distancia_total: number | null;
  endereco_partida: string | null;
  latitude_partida: number | null;
  longitude_partida: number | null;
  endereco_final: string | null;
  latitude_final: number | null;
  longitude_final: number | null;
}

interface Ponto {
  id: string;
  ordem: number;
  latitude: number | null;
  longitude: number | null;
  endereco_manual: string | null;
  eleitores: {
    nome_completo: string;
  } | null;
}

const RoteirosMap = ({
  mapCenter,
  selectedRoteiroData,
  routeGeometry,
  pontos,
  roteiroPartidaIcon,
  roteiroFimIcon,
  createNumberIcon
}: {
  mapCenter: [number, number];
  selectedRoteiroData: Roteiro | null;
  routeGeometry: [number, number][];
  pontos: Ponto[];
  roteiroPartidaIcon: L.DivIcon;
  roteiroFimIcon: L.DivIcon;
  createNumberIcon: (numero: number) => L.DivIcon;
}) => {
  if (!mapCenter || mapCenter.length !== 2) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        Carregando mapa...
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selectedRoteiroData && selectedRoteiroData.latitude_partida && selectedRoteiroData.longitude_partida && (
        <Marker
          position={[selectedRoteiroData.latitude_partida, selectedRoteiroData.longitude_partida]}
          icon={roteiroPartidaIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🚀 Ponto de Partida</strong>
              <br />
              {selectedRoteiroData.endereco_partida || 'Endereço de partida'}
            </div>
          </Popup>
        </Marker>
      )}

      {selectedRoteiroData && selectedRoteiroData.latitude_final && selectedRoteiroData.longitude_final && (
        <Marker
          position={[selectedRoteiroData.latitude_final, selectedRoteiroData.longitude_final]}
          icon={roteiroFimIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🏁 Ponto de Chegada</strong>
              <br />
              {selectedRoteiroData.endereco_final || 'Endereço final'}
            </div>
          </Popup>
        </Marker>
      )}

      {routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
        />
      )}

      {pontos.length > 0 && (
        <MarkerClusterGroup>
          {pontos.map((ponto) => (
            ponto.latitude && ponto.longitude && (
              <Marker
                key={ponto.id}
                position={[ponto.latitude, ponto.longitude]}
                icon={createNumberIcon(ponto.ordem)}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Parada {ponto.ordem}</strong>
                    <br />
                    {ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}
                    {ponto.endereco_manual && (
                      <>
                        <br />
                        <span className="text-xs bg-secondary px-1 rounded">Endereço alternativo:</span>
                        <br />
                        <span className="text-muted-foreground">{ponto.endereco_manual}</span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  );
};

const Roteiros = () => {
  const { currentGabinete } = useGabinete();
  const { hasPermission } = usePermissions();
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [selectedRoteiro, setSelectedRoteiro] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoteiroForMap, setSelectedRoteiroForMap] = useState<string | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [selectedRoteiroData, setSelectedRoteiroData] = useState<Roteiro | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-30.0346, -51.2177]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [locaisVisitados, setLocaisVisitados] = useState(0);

  useEffect(() => {
    if (currentGabinete) {
      fetchRoteiros();
      fetchLocaisVisitados();
    }
  }, [currentGabinete]);

  useEffect(() => {
    if (selectedRoteiroForMap) {
      fetchPontos(selectedRoteiroForMap);
      const roteiro = roteiros.find(r => r.id === selectedRoteiroForMap);
      setSelectedRoteiroData(roteiro || null);
      
      // Calcular rota quando selecionar um roteiro
      if (roteiro) {
        calculateRoute(roteiro);
      }
    } else {
      setPontos([]);
      setSelectedRoteiroData(null);
      setRouteGeometry([]);
    }
  }, [selectedRoteiroForMap, roteiros]);

  const fetchRoteiros = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar roteiros:', error);
      return;
    }

    setRoteiros(data || []);
  };

  const fetchLocaisVisitados = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from('roteiro_pontos')
      .select('visitado, roteiros!inner(gabinete_id)')
      .eq('roteiros.gabinete_id', currentGabinete.gabinete_id)
      .eq('visitado', true);

    if (error) {
      console.error('Erro ao buscar locais visitados:', error);
      return;
    }

    setLocaisVisitados(data?.length || 0);
  };

  const fetchPontos = async (roteiroId: string) => {
    const { data, error } = await supabase
      .from('roteiro_pontos')
      .select('id, ordem, latitude, longitude, endereco_manual, eleitores(nome_completo)')
      .eq('roteiro_id', roteiroId)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar pontos:', error);
      return;
    }

    const validPontos = (data || []).filter(p => p.latitude && p.longitude);
    setPontos(validPontos as Ponto[]);
    
    if (validPontos.length > 0 && validPontos[0].latitude && validPontos[0].longitude) {
      setMapCenter([validPontos[0].latitude, validPontos[0].longitude]);
    }
  };

  const calculateRoute = async (roteiro: Roteiro) => {
    try {
      // Buscar pontos do roteiro
      const { data: pontosData } = await supabase
        .from('roteiro_pontos')
        .select('latitude, longitude, ordem')
        .eq('roteiro_id', roteiro.id)
        .order('ordem');

      if (!pontosData || pontosData.length === 0) {
        setRouteGeometry([]);
        return;
      }

      // Criar array de coordenadas: partida -> pontos -> final
      const coordinates = [];
      
      if (roteiro.latitude_partida && roteiro.longitude_partida) {
        coordinates.push(`${roteiro.longitude_partida},${roteiro.latitude_partida}`);
      }
      
      pontosData.forEach(ponto => {
        if (ponto.latitude && ponto.longitude) {
          coordinates.push(`${ponto.longitude},${ponto.latitude}`);
        }
      });
      
      if (roteiro.latitude_final && roteiro.longitude_final) {
        coordinates.push(`${roteiro.longitude_final},${roteiro.latitude_final}`);
      }

      if (coordinates.length >= 2) {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates.join(';')}?overview=full&geometries=geojson`;
        
        const routeResponse = await fetch(osrmUrl);
        
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          
          if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
            const route = routeData.routes[0];
            // Converter coordenadas de [lng, lat] para [lat, lng]
            const geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
            setRouteGeometry(geometry);
          }
        }
      } else {
        setRouteGeometry([]);
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setRouteGeometry([]);
    }
  };

  const filteredRoteiros = useMemo(() => {
    return roteiros.filter(r =>
      r.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roteiros, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = roteiros.filter(r => {
      const roteiroDate = new Date(r.data);
      return roteiroDate.getMonth() === now.getMonth() &&
             roteiroDate.getFullYear() === now.getFullYear();
    });

    const today = roteiros.filter(r => {
      const roteiroDate = new Date(r.data);
      return roteiroDate.toDateString() === now.toDateString() &&
             r.status === 'em_andamento';
    });

    const distanciaTotal = roteiros.reduce((acc, r) => {
      const distancia = typeof r.distancia_total === 'number' ? r.distancia_total : 0;
      return acc + distancia;
    }, 0);

    return {
      totalRoteiros: thisMonth.length,
      emAndamento: today.length,
      locaisVisitados: locaisVisitados,
      distanciaTotal: distanciaTotal
    };
  }, [roteiros, locaisVisitados]);

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

  const createNumberIcon = (numero: number) => {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg">${numero}</div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createCustomIcon = (color: string, emoji: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-size: 20px;">${emoji}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  const roteiroPartidaIcon = createCustomIcon('#22c55e', '🚀');
  const roteiroFimIcon = createCustomIcon('#3b82f6', '🏁');

  // Verificar permissão de visualização (depois de todos os hooks)
  if (!hasPermission('view_roteiros')) {
    return <NoPermissionMessage />;
  }

  if (!currentGabinete) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roteiros</h1>
          <p className="text-muted-foreground">
            Planejamento de visitas em bairros e cidades
          </p>
        </div>
        <PermissionGuard permission="create_roteiros">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Roteiro
          </Button>
        </PermissionGuard>
      </div>

      <RoteirosStats {...stats} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roteiros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredRoteiros.map((roteiro) => (
              <Card
                key={roteiro.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedRoteiroForMap === roteiro.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedRoteiroForMap(roteiro.id);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{roteiro.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(roteiro.data), "dd 'de' MMMM", { locale: ptBR })}
                        {roteiro.hora_inicio && ` às ${roteiro.hora_inicio}`}
                      </p>
                    </div>
                    {getStatusBadge(roteiro.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {roteiro.objetivo && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {roteiro.objetivo}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoteiro(roteiro.id);
                      setShowDetailsSheet(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}

            {filteredRoteiros.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum roteiro encontrado
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="h-[600px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Visualização do Roteiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-4rem)]">
            <RoteirosMap
              mapCenter={mapCenter}
              selectedRoteiroData={selectedRoteiroData}
              routeGeometry={routeGeometry}
              pontos={pontos}
              roteiroPartidaIcon={roteiroPartidaIcon}
              roteiroFimIcon={roteiroFimIcon}
              createNumberIcon={createNumberIcon}
            />
          </CardContent>
        </Card>
      </div>

      <AddRoteiroDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onRoteiroAdded={() => {
          fetchRoteiros();
          fetchLocaisVisitados();
        }}
      />

      <RoteiroDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        roteiroId={selectedRoteiro}
        onRoteiroUpdated={() => {
          fetchRoteiros();
          fetchLocaisVisitados();
        }}
      />
    </div>
  );
};

export default Roteiros;