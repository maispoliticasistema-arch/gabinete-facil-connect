import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../components/mapa/MapStyles.css';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MapPin, 
  Filter, 
  X,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for different marker types
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
  latitude: number;
  longitude: number;
}

interface Demanda {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  created_at: string;
  eleitores: {
    nome_completo: string;
    latitude: number;
    longitude: number;
    bairro: string | null;
    cidade: string | null;
  };
}

interface Stats {
  totalEleitores: number;
  demandasAbertas: number;
  demandasConcluidas: number;
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

const Mapa = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  
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
  
  // Stats
  const [stats, setStats] = useState<Stats>({
    totalEleitores: 0,
    demandasAbertas: 0,
    demandasConcluidas: 0,
  });

  // Default center (Brazil center)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7939, -47.8828]);
  const [mapZoom] = useState(4);

  useEffect(() => {
    if (currentGabinete) {
      fetchData();
    }
  }, [currentGabinete]);

  const fetchData = async () => {
    if (!currentGabinete) return;
    
    setLoading(true);
    try {
      // Fetch eleitores with coordinates
      const { data: eleitoresData, error: eleitoresError } = await supabase
        .from('eleitores')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (eleitoresError) throw eleitoresError;

      // Fetch demandas with eleitor location
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

      const validEleitores = (eleitoresData || []) as Eleitor[];
      const validDemandas = (demandasData || []).filter(d => d.eleitores) as Demanda[];

      setEleitores(validEleitores);
      setDemandas(validDemandas);

      // Calculate stats
      const demandasAbertas = validDemandas.filter(d => d.status === 'aberta' || d.status === 'em_andamento').length;
      const demandasConcluidas = validDemandas.filter(d => d.status === 'concluida').length;

      setStats({
        totalEleitores: validEleitores.length,
        demandasAbertas,
        demandasConcluidas,
      });

      // Set map center to first eleitor location if available
      if (validEleitores.length > 0) {
        setMapCenter([validEleitores[0].latitude, validEleitores[0].longitude]);
      }

    } catch (error: any) {
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
      if (selectedCidade !== 'all' && d.eleitores.cidade !== selectedCidade) return false;
      if (selectedBairro !== 'all' && d.eleitores.bairro !== selectedBairro) return false;
      if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
      return true;
    });
  }, [demandas, selectedCidade, selectedBairro, selectedStatus]);

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

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} />

        {/* Eleitores Markers */}
        {showEleitores && filteredEleitores.map((eleitor) => (
          <Marker
            key={`eleitor-${eleitor.id}`}
            position={[eleitor.latitude, eleitor.longitude]}
            icon={eleitorIcon}
          >
            <Popup maxWidth={300}>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-base mb-2">{eleitor.nome_completo}</h3>
                <div className="space-y-1 text-sm">
                  {eleitor.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{eleitor.telefone}</span>
                    </div>
                  )}
                  {eleitor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{eleitor.email}</span>
                    </div>
                  )}
                  {(eleitor.endereco || eleitor.bairro || eleitor.cidade) && (
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-xs">
                        {eleitor.endereco && <div>{eleitor.endereco}{eleitor.numero && `, ${eleitor.numero}`}</div>}
                        {eleitor.bairro && <div>{eleitor.bairro}</div>}
                        {eleitor.cidade && <div>{eleitor.cidade} - {eleitor.estado}</div>}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => window.location.href = `/eleitores`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver Detalhes
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Demandas Markers */}
        {showDemandas && filteredDemandas.map((demanda) => {
          const isOpen = demanda.status === 'aberta' || demanda.status === 'em_andamento';
          const icon = isOpen ? demandaAbertaIcon : demandaConcluidaIcon;
          
          return (
            <Marker
              key={`demanda-${demanda.id}`}
              position={[demanda.eleitores.latitude, demanda.eleitores.longitude]}
              icon={icon}
            >
              <Popup maxWidth={300}>
                <div className="p-2 min-w-[250px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm">{demanda.titulo}</h3>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-xs shrink-0",
                        isOpen ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                      )}
                    >
                      {demanda.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{demanda.eleitores.nome_completo}</span>
                    </div>
                    {demanda.eleitores.bairro && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{demanda.eleitores.bairro} - {demanda.eleitores.cidade}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {demanda.prioridade}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => window.location.href = `/demandas`}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Mapa;
