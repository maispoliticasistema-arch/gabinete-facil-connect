import { useEffect, useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MapPin, 
  Filter, 
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 16px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const eleitorIcon = createCustomIcon('#3b82f6', '👤');
const demandaAbertaIcon = createCustomIcon('#ef4444', '⚠️');
const demandaConcluidaIcon = createCustomIcon('#22c55e', '✓');

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Demanda {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  created_at: string;
  eleitores: {
    nome_completo: string;
    latitude: number | null;
    longitude: number | null;
    bairro: string | null;
    cidade: string | null;
  } | null;
}

const Mapa = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Filters
  const [showEleitores, setShowEleitores] = useState(true);
  const [showDemandas, setShowDemandas] = useState(true);
  const [selectedCidade, setSelectedCidade] = useState<string>('all');
  const [selectedBairro, setSelectedBairro] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Initialize map FIRST
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('Initializing map...');
    
    // Direct initialization without timeout
    try {
      if (!mapContainerRef.current) return;
      
      const map = L.map(mapContainerRef.current, {
        center: [-15.7939, -47.8828],
        zoom: 4,
        scrollWheelZoom: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapRef.current = map;
      
      // Force resize immediately and after a delay
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
        setMapInitialized(true);
        console.log('Map initialized successfully');
      }, 200);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Fetch data
  useEffect(() => {
    if (currentGabinete && mapInitialized) {
      fetchData();
    }
  }, [currentGabinete, mapInitialized]);

  const fetchData = async () => {
    if (!currentGabinete) return;
    
    console.log('Fetching data for gabinete:', currentGabinete.gabinete_id);
    setLoading(true);
    
    try {
      // Fetch ALL eleitores first
      const { data: allEleitores, error: eleitoresError } = await supabase
        .from('eleitores')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id);

      if (eleitoresError) throw eleitoresError;
      
      console.log('Total eleitores:', allEleitores?.length || 0);
      console.log('Eleitores com coordenadas:', allEleitores?.filter(e => e.latitude && e.longitude).length || 0);

      // Filter only those with coordinates for map display
      const eleitoresWithCoords = (allEleitores || []).filter(
        e => e.latitude !== null && e.longitude !== null
      ) as Eleitor[];

      // Fetch demandas
      const { data: demandasData, error: demandasError } = await supabase
        .from('demandas')
        .select(`
          id,
          titulo,
          status,
          prioridade,
          created_at,
          eleitores (
            nome_completo,
            latitude,
            longitude,
            bairro,
            cidade
          )
        `)
        .eq('gabinete_id', currentGabinete.gabinete_id);

      if (demandasError) throw demandasError;

      const validDemandas = (demandasData || []).filter(
        d => d.eleitores && d.eleitores.latitude && d.eleitores.longitude
      ) as Demanda[];

      console.log('Demandas com coordenadas:', validDemandas.length);

      setEleitores(eleitoresWithCoords);
      setDemandas(validDemandas);

      // Center map on first eleitor with coordinates if available
      if (eleitoresWithCoords.length > 0 && mapRef.current) {
        const first = eleitoresWithCoords[0];
        if (first.latitude && first.longitude) {
          mapRef.current.setView([first.latitude, first.longitude], 13);
        }
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique cities and bairros
  const cidades = useMemo(() => {
    const unique = new Set(eleitores.map(e => e.cidade).filter(Boolean));
    return Array.from(unique).sort() as string[];
  }, [eleitores]);

  const bairros = useMemo(() => {
    const filtered = selectedCidade === 'all' 
      ? eleitores 
      : eleitores.filter(e => e.cidade === selectedCidade);
    const unique = new Set(filtered.map(e => e.bairro).filter(Boolean));
    return Array.from(unique).sort() as string[];
  }, [eleitores, selectedCidade]);

  // Filter data
  const filteredEleitores = useMemo(() => {
    return eleitores.filter(e => {
      if (selectedCidade !== 'all' && e.cidade !== selectedCidade) return false;
      if (selectedBairro !== 'all' && e.bairro !== selectedBairro) return false;
      return true;
    });
  }, [eleitores, selectedCidade, selectedBairro]);

  const filteredDemandas = useMemo(() => {
    return demandas.filter(d => {
      if (!d.eleitores) return false;
      if (selectedCidade !== 'all' && d.eleitores.cidade !== selectedCidade) return false;
      if (selectedBairro !== 'all' && d.eleitores.bairro !== selectedBairro) return false;
      if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
      return true;
    });
  }, [demandas, selectedCidade, selectedBairro, selectedStatus]);

  // Update markers when filters or data change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInitialized) return;

    console.log('Updating markers:', filteredEleitores.length, 'eleitores,', filteredDemandas.length, 'demandas');

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add eleitor markers
    if (showEleitores) {
      filteredEleitores.forEach(eleitor => {
        if (!eleitor.latitude || !eleitor.longitude) return;
        
        const marker = L.marker([eleitor.latitude, eleitor.longitude], {
          icon: eleitorIcon,
        });

        const popupContent = `
          <div style="padding: 8px; min-width: 250px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${eleitor.nome_completo}</h3>
            <div style="font-size: 14px; line-height: 1.5;">
              ${eleitor.telefone ? `<div style="margin-bottom: 4px;">📞 ${eleitor.telefone}</div>` : ''}
              ${eleitor.email ? `<div style="margin-bottom: 4px;">✉️ ${eleitor.email}</div>` : ''}
              ${eleitor.endereco || eleitor.bairro || eleitor.cidade ? `
                <div style="margin-top: 8px;">
                  📍 <div style="font-size: 12px;">
                    ${eleitor.endereco ? `${eleitor.endereco}${eleitor.numero ? `, ${eleitor.numero}` : ''}<br>` : ''}
                    ${eleitor.bairro ? `${eleitor.bairro}<br>` : ''}
                    ${eleitor.cidade ? `${eleitor.cidade} - ${eleitor.estado}` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Add demanda markers
    if (showDemandas) {
      filteredDemandas.forEach(demanda => {
        if (!demanda.eleitores || !demanda.eleitores.latitude || !demanda.eleitores.longitude) return;
        
        const isOpen = demanda.status === 'aberta' || demanda.status === 'em_andamento';
        const icon = isOpen ? demandaAbertaIcon : demandaConcluidaIcon;
        
        const marker = L.marker([demanda.eleitores.latitude, demanda.eleitores.longitude], {
          icon: icon,
        });

        const statusColor = isOpen ? '#ef4444' : '#22c55e';
        const popupContent = `
          <div style="padding: 8px; min-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px; margin-bottom: 8px;">
              <h3 style="font-weight: bold; font-size: 14px;">${demanda.titulo}</h3>
              <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 2px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap;">${demanda.status.replace('_', ' ')}</span>
            </div>
            <div style="font-size: 12px; line-height: 1.5;">
              <div style="margin-bottom: 4px;">👤 ${demanda.eleitores.nome_completo}</div>
              ${demanda.eleitores.bairro ? `<div style="margin-bottom: 4px;">📍 ${demanda.eleitores.bairro} - ${demanda.eleitores.cidade}</div>` : ''}
              <div style="margin-top: 8px;">
                <span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${demanda.prioridade}</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [filteredEleitores, filteredDemandas, showEleitores, showDemandas, mapInitialized]);

  const clearFilters = () => {
    setSelectedCidade('all');
    setSelectedBairro('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = selectedCidade !== 'all' || selectedBairro !== 'all' || selectedStatus !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Stats Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="flex gap-2 justify-center flex-wrap pointer-events-auto">
          <Card className="shadow-lg border-2">
            <CardContent className="flex items-center gap-2 p-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Eleitores</p>
                <p className="text-lg font-bold">{filteredEleitores.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-2">
            <CardContent className="flex items-center gap-2 p-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Abertas</p>
                <p className="text-lg font-bold">{filteredDemandas.filter(d => d.status === 'aberta' || d.status === 'em_andamento').length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-2">
            <CardContent className="flex items-center gap-2 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-lg font-bold">{filteredDemandas.filter(d => d.status === 'concluida').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "absolute top-24 z-[1000] shadow-lg transition-all",
          sidebarOpen ? "right-[320px]" : "right-4"
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-80 bg-background border-l shadow-2xl z-[999] transition-transform duration-300",
          !sidebarOpen && "translate-x-full"
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Inteligência Territorial
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize e filtre eleitores e demandas
              </p>
            </div>

            <Separator />

            {/* Show/Hide Options */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Exibir no Mapa
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-eleitores"
                    checked={showEleitores}
                    onCheckedChange={(checked) => setShowEleitores(checked as boolean)}
                  />
                  <Label htmlFor="show-eleitores" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    Eleitores ({filteredEleitores.length})
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-demandas"
                    checked={showDemandas}
                    onCheckedChange={(checked) => setShowDemandas(checked as boolean)}
                  />
                  <Label htmlFor="show-demandas" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    Demandas ({filteredDemandas.length})
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Filters */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Localização</h3>
              
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={selectedCidade} onValueChange={setSelectedCidade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cidades.map(cidade => (
                      <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bairro</Label>
                <Select value={selectedBairro} onValueChange={setSelectedBairro}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bairros</SelectItem>
                    {bairros.map(bairro => (
                      <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Demanda Status Filter */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Status da Demanda</h3>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </>
            )}

            <Separator />

            {/* Legend */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Legenda</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">👤</div>
                  <span>Eleitor cadastrado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">⚠️</div>
                  <span>Demanda aberta/em andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <span>Demanda concluída</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        id="map"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
    </div>
  );
};

export default Mapa;
