import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

const Mapa = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  
  const [eleitores, setEleitores] = useState<any[]>([]);
  const [demandas, setDemandas] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7939, -47.8828]);
  const [mapZoom, setMapZoom] = useState(4);
  
  const [showEleitores, setShowEleitores] = useState(true);
  const [showDemandas, setShowDemandas] = useState(true);
  const [selectedCidade, setSelectedCidade] = useState<string>('all');
  const [selectedBairro, setSelectedBairro] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    if (!currentGabinete) return;
    
    console.log('Fetching data for gabinete:', currentGabinete.gabinete_id);
    
    const fetchData = async () => {
      try {
        const { data: eleitoresData, error: eleitoresError } = await supabase
          .from('eleitores')
          .select('*')
          .eq('gabinete_id', currentGabinete.gabinete_id);

        if (eleitoresError) {
          console.error('Error fetching eleitores:', eleitoresError);
          throw eleitoresError;
        }

        const eleitoresComCoords = (eleitoresData || []).filter(e => e.latitude && e.longitude);
        console.log('Eleitores fetched:', eleitoresData?.length || 0, 'com coordenadas:', eleitoresComCoords.length);

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

        if (demandasError) {
          console.error('Error fetching demandas:', demandasError);
          throw demandasError;
        }

        console.log('Demandas fetched:', demandasData?.length || 0);

        const validDemandas = (demandasData || []).filter(d => d.eleitores && d.eleitores.latitude && d.eleitores.longitude);
        console.log('Valid demandas with coords:', validDemandas.length);

        setEleitores(eleitoresComCoords);
        setDemandas(validDemandas);

        if (eleitoresComCoords.length > 0) {
          setMapCenter([eleitoresComCoords[0].latitude, eleitoresComCoords[0].longitude]);
          setMapZoom(13);
        }
      } catch (error: any) {
        console.error('Error in fetchData:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [currentGabinete, toast]);

  const cidades = useMemo(() => {
    const unique = new Set(eleitores.map(e => e.cidade).filter(Boolean));
    return Array.from(unique).sort();
  }, [eleitores]);

  const bairros = useMemo(() => {
    const filtered = selectedCidade === 'all' ? eleitores : eleitores.filter(e => e.cidade === selectedCidade);
    const unique = new Set(filtered.map(e => e.bairro).filter(Boolean));
    return Array.from(unique).sort();
  }, [eleitores, selectedCidade]);

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

  const eleitoresMarkers = useMemo(() => {
    if (!showEleitores) return [];
    return filteredEleitores.map(eleitor => ({
      position: [eleitor.latitude, eleitor.longitude] as [number, number],
      icon: eleitorIcon,
      popup: `
        <div style="padding: 8px; min-width: 250px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${eleitor.nome_completo}</h3>
          <div style="font-size: 14px;">
            ${eleitor.telefone ? `<div>📞 ${eleitor.telefone}</div>` : ''}
            ${eleitor.email ? `<div>✉️ ${eleitor.email}</div>` : ''}
            ${eleitor.endereco ? `<div>📍 ${eleitor.endereco}${eleitor.numero ? `, ${eleitor.numero}` : ''}</div>` : ''}
            ${eleitor.bairro ? `<div>${eleitor.bairro} - ${eleitor.cidade}</div>` : ''}
          </div>
        </div>
      `,
    }));
  }, [filteredEleitores, showEleitores]);

  const demandasMarkers = useMemo(() => {
    if (!showDemandas) return [];
    return filteredDemandas.map(demanda => {
      const isOpen = demanda.status === 'aberta' || demanda.status === 'em_andamento';
      const icon = isOpen ? demandaAbertaIcon : demandaConcluidaIcon;
      const color = isOpen ? '#ef4444' : '#22c55e';
      
      return {
        position: [demanda.eleitores.latitude, demanda.eleitores.longitude] as [number, number],
        icon,
        popup: `
          <div style="padding: 8px; min-width: 250px;">
            <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${demanda.titulo}</h3>
            <span style="background-color: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${demanda.status.replace('_', ' ')}</span>
            <div style="font-size: 12px; margin-top: 8px;">
              <div>👤 ${demanda.eleitores.nome_completo}</div>
              ${demanda.eleitores.bairro ? `<div>📍 ${demanda.eleitores.bairro} - ${demanda.eleitores.cidade}</div>` : ''}
            </div>
          </div>
        `,
      };
    });
  }, [filteredDemandas, showDemandas]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 500, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}>
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

      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        className={cn("absolute top-24 z-[1001] shadow-lg transition-all", sidebarOpen ? "right-[320px]" : "right-4")}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div className={cn("absolute top-0 right-0 h-full w-80 bg-background border-l shadow-2xl z-[1002] transition-transform duration-300", !sidebarOpen && "translate-x-full")}>
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Inteligência Territorial
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Visualize e filtre eleitores e demandas</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Exibir no Mapa
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="show-eleitores" checked={showEleitores} onCheckedChange={(checked) => setShowEleitores(checked as boolean)} />
                  <Label htmlFor="show-eleitores" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    Eleitores ({filteredEleitores.length})
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="show-demandas" checked={showDemandas} onCheckedChange={(checked) => setShowDemandas(checked as boolean)} />
                  <Label htmlFor="show-demandas" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    Demandas ({filteredDemandas.length})
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Localização</h3>
              
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={selectedCidade} onValueChange={setSelectedCidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cidades.map(cidade => <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bairro</Label>
                <Select value={selectedBairro} onValueChange={setSelectedBairro}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bairros</SelectItem>
                    {bairros.map(bairro => <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Status da Demanda</h3>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedCidade !== 'all' || selectedBairro !== 'all' || selectedStatus !== 'all') && (
              <>
                <Separator />
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedCidade('all');
                  setSelectedBairro('all');
                  setSelectedStatus('all');
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </>
            )}

            <Separator />

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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {eleitoresMarkers.map((marker, idx) => (
            <Marker key={`eleitor-${idx}`} position={marker.position} icon={marker.icon}>
              <Popup>{<div dangerouslySetInnerHTML={{ __html: marker.popup }} />}</Popup>
            </Marker>
          ))}
          
          {demandasMarkers.map((marker, idx) => (
            <Marker key={`demanda-${idx}`} position={marker.position} icon={marker.icon}>
              <Popup>{<div dangerouslySetInnerHTML={{ __html: marker.popup }} />}</Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default Mapa;
