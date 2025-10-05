import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, NoPermissionMessage } from '@/components/PermissionGuard';
import { EleitoresTable } from '@/components/eleitores/EleitoresTable';
import { AddEleitoresDialog } from '@/components/eleitores/AddEleitoresDialog';
import { ImportEleitoresDialog } from '@/components/eleitores/ImportEleitoresDialog';
import { TagsDialog } from '@/components/eleitores/TagsDialog';
import { EleitoresDetailsSheet } from '@/components/eleitores/EleitoresDetailsSheet';
import { GeocodeAllDialog } from '@/components/eleitores/GeocodeAllDialog';
import { Users, Search, Filter, X, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

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

const Eleitores = () => {
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bairros, setBairros] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedBairro, setSelectedBairro] = useState<string>('');
  const [selectedCidade, setSelectedCidade] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEleitor, setSelectedEleitor] = useState<Eleitor | null>(null);
  const [eleitorSheetOpen, setEleitorSheetOpen] = useState(false);
  const [addEleitorOpen, setAddEleitorOpen] = useState(false);
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const hasActiveFilters = selectedBairro || selectedCidade || selectedTags.length > 0;

  const fetchEleitores = async () => {
    if (!currentGabinete) return;

    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('eleitores')
        .select('*', { count: 'exact' })
        .eq('gabinete_id', currentGabinete.gabinete_id);

      // Aplicar filtro de busca
      if (searchTerm.trim()) {
        query = query.or(`nome_completo.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%`);
      }

      // Aplicar filtro de bairro
      if (selectedBairro) {
        query = query.eq('bairro', selectedBairro);
      }

      // Aplicar filtro de cidade
      if (selectedCidade) {
        query = query.eq('cidade', selectedCidade);
      }

      // Aplicar filtro de tags
      if (selectedTags.length > 0) {
        const { data: eleitoresComTags } = await supabase
          .from('eleitor_tags')
          .select('eleitor_id')
          .in('tag_id', selectedTags);

        if (eleitoresComTags && eleitoresComTags.length > 0) {
          const eleitoresIds = eleitoresComTags.map((et) => et.eleitor_id);
          query = query.in('id', eleitoresIds);
        } else {
          // Se não há eleitores com essas tags, retornar vazio
          setEleitores([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setEleitores((data || []) as unknown as Eleitor[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar eleitores',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    if (!currentGabinete) return;

    try {
      // Buscar bairros únicos
      const { data: bairrosData } = await supabase
        .from('eleitores')
        .select('bairro')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .not('bairro', 'is', null)
        .order('bairro');

      const uniqueBairros = [...new Set(bairrosData?.map((e) => e.bairro).filter(Boolean) || [])];
      setBairros(uniqueBairros as string[]);

      // Buscar cidades únicas
      const { data: cidadesData } = await supabase
        .from('eleitores')
        .select('cidade')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .not('cidade', 'is', null)
        .order('cidade');

      const uniqueCidades = [...new Set(cidadesData?.map((e) => e.cidade).filter(Boolean) || [])];
      setCidades(uniqueCidades as string[]);

      // Buscar tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('nome');

      setTags(tagsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  useEffect(() => {
    fetchEleitores();
  }, [currentGabinete, currentPage, searchTerm, selectedBairro, selectedCidade, selectedTags]);

  useEffect(() => {
    if (currentGabinete) {
      fetchFilterOptions();
    }
  }, [currentGabinete]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSelectedBairro('');
    setSelectedCidade('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setCurrentPage(1);
  };

  const handleEleitoresClick = (eleitor: Eleitor) => {
    setSelectedEleitor(eleitor);
    setEleitorSheetOpen(true);
  };

  // Verificar permissão de visualização
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!hasPermission('view_eleitores')) {
    return <NoPermissionMessage />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eleitores</h1>
          <p className="text-muted-foreground">
            Cadastro completo de eleitores e apoiadores
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="edit_eleitores">
            <GeocodeAllDialog onComplete={fetchEleitores} />
          </PermissionGuard>
          <PermissionGuard permission="manage_settings">
            <TagsDialog />
          </PermissionGuard>
          <PermissionGuard permission="create_eleitores">
            <ImportEleitoresDialog onEleitoresImported={fetchEleitores} />
          </PermissionGuard>
          <PermissionGuard permission="create_eleitores">
            <Button onClick={() => setAddEleitorOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Eleitor
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Lista de Eleitores</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone, email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filtros</h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>

                    {/* Filtro de Bairro */}
                    {bairros.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bairro</label>
                        <Select value={selectedBairro || "__all__"} onValueChange={(value) => {
                          setSelectedBairro(value === "__all__" ? '' : value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os bairros" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">Todos os bairros</SelectItem>
                            {bairros.map((bairro) => (
                              <SelectItem key={bairro} value={bairro}>
                                {bairro}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Filtro de Cidade */}
                    {cidades.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cidade</label>
                        <Select value={selectedCidade || "__all__"} onValueChange={(value) => {
                          setSelectedCidade(value === "__all__" ? '' : value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as cidades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">Todas as cidades</SelectItem>
                            {cidades.map((cidade) => (
                              <SelectItem key={cidade} value={cidade}>
                                {cidade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Filtro de Tags */}
                    {tags.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tags</label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {tags.map((tag) => (
                            <div key={tag.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`filter-tag-${tag.id}`}
                                checked={selectedTags.includes(tag.id)}
                                onCheckedChange={() => toggleTag(tag.id)}
                              />
                              <label
                                htmlFor={`filter-tag-${tag.id}`}
                                className="cursor-pointer"
                              >
                                <Badge
                                  style={{
                                    backgroundColor: tag.cor,
                                    color: '#fff',
                                  }}
                                  className="text-xs"
                                >
                                  {tag.nome}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <CardDescription>
            {loading ? 'Carregando...' : `${totalCount} eleitor(es) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <EleitoresTable 
                eleitores={eleitores} 
                onEleitoresUpdated={fetchEleitores}
                onEleitoresClick={handleEleitoresClick}
              />
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (!isNaN(page)) {
                          goToPage(page);
                        }
                      }}
                      className="w-16 h-8 text-center"
                      placeholder="Pág"
                    />
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => goToPage(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {currentPage > 2 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {currentPage > 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(currentPage - 1)} className="cursor-pointer">
                              {currentPage - 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationLink isActive>
                            {currentPage}
                          </PaginationLink>
                        </PaginationItem>
                        
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(currentPage + 1)} className="cursor-pointer">
                              {currentPage + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {currentPage < totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {currentPage < totalPages - 1 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => goToPage(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EleitoresDetailsSheet
        eleitor={selectedEleitor}
        open={eleitorSheetOpen}
        onOpenChange={setEleitorSheetOpen}
      />
      
      <AddEleitoresDialog 
        open={addEleitorOpen}
        onOpenChange={setAddEleitorOpen}
        onEleitoresAdded={fetchEleitores}
      />
    </div>
  );
};

export default Eleitores;
