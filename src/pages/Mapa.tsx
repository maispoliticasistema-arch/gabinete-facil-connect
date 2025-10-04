import { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

      setEleitores((eleitoresData || []) as Eleitor[]);
      setDemandas((demandasData || []).filter(d => d.eleitores) as Demanda[]);

      // Calculate stats
      const demandasAbertas = demandasData?.filter(d => d.status === 'aberta' || d.status === 'em_andamento').length || 0;
      const demandasConcluidas = demandasData?.filter(d => d.status === 'concluida').length || 0;

      setStats({
        totalEleitores: eleitoresData?.length || 0,
        demandasAbertas,
        demandasConcluidas,
      });

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
    <div className="relative h-screen w-full overflow-hidden bg-muted/30">
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
                Filtros do Mapa
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize a visualização
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

      {/* Temporary Map Placeholder */}
      <div className="h-full w-full flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <MapPin className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Mapa em Desenvolvimento</h2>
            <p className="text-muted-foreground">
              A funcionalidade de mapa está sendo otimizada para melhor performance. 
              Por enquanto, você pode visualizar os dados filtrados abaixo.
            </p>
            
            <div className="pt-4 space-y-3">
              <h3 className="font-semibold">Dados Filtrados:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Eleitores</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredEleitores.length}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Demandas</p>
                  <p className="text-2xl font-bold text-red-600">{filteredDemandas.length}</p>
                </div>
              </div>
            </div>

            <Button className="mt-4" onClick={() => window.location.href = '/eleitores'}>
              Ver Lista de Eleitores
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Mapa;
