import { useState, useEffect } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NoPermissionMessage } from '@/components/PermissionGuard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Globe, Save, Eye, ExternalLink, Settings, Loader2, Layout, FileText, ArrowLeft } from 'lucide-react';
import { PortalEditor } from '@/components/construtor/PortalEditor';
import { PortalPreview } from '@/components/construtor/PortalPreview';
import { RespostasFormulariosTab } from '@/components/construtor/RespostasFormulariosTab';
import { SitesList } from '@/components/construtor/SitesList';
import { CreateSiteDialog } from '@/components/construtor/CreateSiteDialog';
import { Block } from '@/components/construtor/BlockTypes';

const ConstrutorDeSites = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const { isAdmin, loading: permissionsLoading } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [gabineteSlug, setGabineteSlug] = useState('');
  const [editingSlug, setEditingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState('');
  
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    descricao: '',
    site_path: '',
    cor_primaria: '#6366f1',
    cor_secundaria: '#8b5cf6',
  });

  useEffect(() => {
    if (currentGabinete) {
      loadSites();
      generateGabineteSlug();
    }
  }, [currentGabinete]);

  const generateGabineteSlug = async () => {
    if (!currentGabinete) return;
    
    try {
      const { data } = await supabase.rpc(
        'generate_gabinete_slug',
        { gabinete_nome: currentGabinete.gabinetes.nome }
      );
      
      setGabineteSlug(data || '');
    } catch (error) {
      console.error('Erro ao gerar slug:', error);
    }
  };

  const loadSites = async () => {
    if (!currentGabinete) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_gabinete')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinetes.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSites(data || []);
    } catch (error) {
      console.error('Erro ao carregar sites:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os sites.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectSite = (site: any) => {
    setCurrentSite(site);
    setFormData({
      titulo: site.titulo || '',
      subtitulo: site.subtitulo || '',
      descricao: site.descricao || '',
      site_path: site.site_path || '',
      cor_primaria: site.cor_primaria || '#6366f1',
      cor_secundaria: site.cor_secundaria || '#8b5cf6',
    });
    setBlocks((site.layout_json || []) as unknown as Block[]);
  };

  const handleCreateSite = async (sitePath: string, titulo: string) => {
    if (!currentGabinete || !gabineteSlug) return;

    try {
      const siteData = {
        gabinete_id: currentGabinete.gabinetes.id,
        slug: gabineteSlug,
        site_path: sitePath,
        titulo: titulo,
        subtitulo: '',
        descricao: '',
        cor_primaria: '#6366f1',
        cor_secundaria: '#8b5cf6',
        layout_json: [],
        publicado: false,
      };

      const { data, error } = await supabase
        .from('portal_gabinete')
        .insert(siteData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Site criado!',
        description: 'Seu novo site foi criado com sucesso.',
      });

      await loadSites();
      selectSite(data);
    } catch (error: any) {
      console.error('Erro ao criar site:', error);
      toast({
        title: 'Erro ao criar site',
        description: error.message || 'Não foi possível criar o site.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSave = async () => {
    if (!currentGabinete || !currentSite) return;

    if (!formData.site_path.trim()) {
      toast({
        title: 'Caminho obrigatório',
        description: 'O caminho do site é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const siteData = {
        ...formData,
        slug: gabineteSlug,
        layout_json: blocks as any,
      };

      const { error } = await supabase
        .from('portal_gabinete')
        .update(siteData)
        .eq('id', currentSite.id);

      if (error) throw error;

      toast({
        title: 'Salvo com sucesso!',
        description: 'As configurações do site foram salvas.',
      });

      await loadSites();
    } catch (error: any) {
      console.error('Erro ao salvar site:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentSite) {
      toast({
        title: 'Salve primeiro',
        description: 'Você precisa salvar as configurações antes de publicar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPublishedState = !currentSite.publicado;
      
      const { error } = await supabase
        .from('portal_gabinete')
        .update({ publicado: newPublishedState })
        .eq('id', currentSite.id);

      if (error) throw error;

      toast({
        title: newPublishedState ? 'Site publicado!' : 'Site despublicado',
        description: newPublishedState 
          ? 'Seu site está agora visível publicamente.'
          : 'Seu site não está mais visível publicamente.',
      });

      // Atualizar o site atual na interface
      setCurrentSite({ ...currentSite, publicado: newPublishedState });
      
      // Recarregar a lista
      await loadSites();
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast({
        title: 'Erro ao publicar',
        description: 'Não foi possível alterar o status de publicação.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      const { error } = await supabase
        .from('portal_gabinete')
        .delete()
        .eq('id', siteId);

      if (error) throw error;

      toast({
        title: 'Site excluído',
        description: 'O site foi excluído com sucesso.',
      });

      if (currentSite?.id === siteId) {
        setCurrentSite(null);
      }

      await loadSites();
    } catch (error) {
      console.error('Erro ao excluir site:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o site.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSlug = async () => {
    if (!currentGabinete || !tempSlug.trim()) return;

    const cleanedSlug = tempSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    if (!cleanedSlug) {
      toast({
        title: 'Slug inválido',
        description: 'O slug deve conter pelo menos um caractere válido.',
        variant: 'destructive',
      });
      return;
    }

    if (cleanedSlug === gabineteSlug) {
      setEditingSlug(false);
      return;
    }

    try {
      // Verificar se o slug já existe em outro gabinete
      const { data: existingGabinete } = await supabase
        .from('portal_gabinete')
        .select('gabinete_id')
        .eq('slug', cleanedSlug)
        .neq('gabinete_id', currentGabinete.gabinetes.id)
        .maybeSingle();

      if (existingGabinete) {
        toast({
          title: 'Slug já está em uso',
          description: 'Este slug já está sendo usado por outro gabinete.',
          variant: 'destructive',
        });
        return;
      }

      // Atualizar todos os sites deste gabinete com o novo slug
      const { error } = await supabase
        .from('portal_gabinete')
        .update({ slug: cleanedSlug })
        .eq('gabinete_id', currentGabinete.gabinetes.id);

      if (error) throw error;

      setGabineteSlug(cleanedSlug);
      setEditingSlug(false);

      toast({
        title: 'Slug atualizado!',
        description: 'O slug do gabinete foi atualizado com sucesso. Todas as URLs foram atualizadas.',
      });

      await loadSites();
    } catch (error: any) {
      console.error('Erro ao atualizar slug:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o slug.',
        variant: 'destructive',
      });
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <NoPermissionMessage />;
  }

  // Lista de sites (quando nenhum site está selecionado)
  if (!currentSite) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Construtor de Sites
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie múltiplos sites públicos do seu gabinete
          </p>
        </div>

        <Card className="bg-muted">
          <CardContent className="pt-6">
            {!editingSlug ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Slug do Gabinete:</span>
                    <code className="px-2 py-1 bg-background rounded">/{gabineteSlug}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempSlug(gabineteSlug);
                      setEditingSlug(true);
                    }}
                  >
                    Editar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos os seus sites usarão este slug base. Ex: /{gabineteSlug}/portal, /{gabineteSlug}/projetos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium text-sm">Editar Slug do Gabinete</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">/</span>
                      <Input
                        value={tempSlug}
                        onChange={(e) => setTempSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        placeholder="slug-do-gabinete"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingSlug(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleUpdateSlug}>
                    Salvar
                  </Button>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">
                    ⚠️ Atenção: Alterar o slug afetará todos os sites
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    As URLs de todos os sites publicados serão modificadas. Sites que já foram compartilhados precisarão ter seus links atualizados.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <SitesList
          sites={sites}
          currentSiteId={null}
          onSelectSite={(id) => {
            const site = sites.find(s => s.id === id);
            if (site) selectSite(site);
          }}
          onCreateSite={() => setShowCreateDialog(true)}
          onDeleteSite={handleDeleteSite}
        />

        <CreateSiteDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreateSite={handleCreateSite}
        />
      </div>
    );
  }

  // Editor de site selecionado
  const siteUrl = `${window.location.origin}/${gabineteSlug}/${formData.site_path}`;

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentSite(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="h-8 w-8" />
              {formData.titulo || 'Sem título'}
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              /{gabineteSlug}/{formData.site_path}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {currentSite?.publicado && (
              <Badge variant="default" className="gap-1">
                <Globe className="h-3 w-3" />
                Publicado
              </Badge>
            )}
            {currentSite && !currentSite.publicado && (
              <Badge variant="secondary">Rascunho</Badge>
            )}
          </div>
        </div>
      </div>

      {/* URL Preview & Publication Status */}
      <Card className={currentSite.publicado ? "bg-primary/5 border-primary/20" : "bg-muted border-muted"}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">URL do Site</Label>
                <p className="text-sm font-mono mt-1 break-all">{siteUrl}</p>
                {!currentSite.publicado && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ Site não publicado - apenas você pode ver este link
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(siteUrl, '_blank')}
                  disabled={!currentSite.publicado}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant={currentSite.publicado ? "secondary" : "default"}
                  onClick={handlePublish}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {currentSite.publicado ? 'Despublicar' : 'Publicar Agora'}
                </Button>
              </div>
            </div>
            {currentSite.publicado && (
              <div className="bg-primary/10 border border-primary/20 rounded p-3 text-sm">
                <p className="font-semibold text-primary mb-1">✓ Site Público</p>
                <p className="text-xs text-muted-foreground">
                  Seu site está visível publicamente. Qualquer pessoa com o link pode acessá-lo.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">
            <Layout className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="respostas">
            <FileText className="h-4 w-4 mr-2" />
            Respostas
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <PortalEditor
            blocks={blocks}
            onChange={setBlocks}
            colors={{
              primary: formData.cor_primaria,
              secondary: formData.cor_secundaria,
            }}
          />
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Layout
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <PortalPreview
            blocks={blocks}
            colors={{
              primary: formData.cor_primaria,
              secondary: formData.cor_secundaria,
            }}
          />
        </TabsContent>

        <TabsContent value="respostas">
          <RespostasFormulariosTab />
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais do seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Site *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Portal Oficial"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitulo">Subtítulo</Label>
                <Input
                  id="subtitulo"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitulo: e.target.value }))}
                  placeholder="Ex: Trabalhando por um futuro melhor"
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o mandato e os objetivos..."
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_path">Caminho do Site *</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                    /{gabineteSlug}/
                  </span>
                  <Input
                    id="site_path"
                    value={formData.site_path}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      site_path: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                    }))}
                    placeholder="portal"
                    maxLength={100}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use apenas letras, números e hífens
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cores e Identidade</CardTitle>
              <CardDescription>
                Personalize as cores do seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor_primaria"
                      type="color"
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                      placeholder="#6366f1"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor_secundaria"
                      type="color"
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                      placeholder="#8b5cf6"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => selectSite(currentSite)}
              disabled={saving}
            >
              Descartar alterações
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant={currentSite.publicado ? "secondary" : "default"}
                onClick={handlePublish}
                disabled={saving}
              >
                <Globe className="h-4 w-4 mr-2" />
                {currentSite.publicado ? 'Despublicar' : 'Publicar Site'}
              </Button>
              
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConstrutorDeSites;
