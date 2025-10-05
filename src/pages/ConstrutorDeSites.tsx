import { useState, useEffect } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Globe, Save, Eye, ExternalLink, Settings, Loader2, Layout } from 'lucide-react';
import { PortalEditor } from '@/components/construtor/PortalEditor';
import { Block } from '@/components/construtor/BlockTypes';

const ConstrutorDeSites = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portal, setPortal] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    descricao: '',
    slug: '',
    cor_primaria: '#6366f1',
    cor_secundaria: '#8b5cf6',
  });

  useEffect(() => {
    if (currentGabinete) {
      loadPortal();
    }
  }, [currentGabinete]);

  const loadPortal = async () => {
    if (!currentGabinete) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_gabinete')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinetes.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPortal(data);
        setFormData({
          titulo: data.titulo || '',
          subtitulo: data.subtitulo || '',
          descricao: data.descricao || '',
          slug: data.slug || '',
          cor_primaria: data.cor_primaria || '#6366f1',
          cor_secundaria: data.cor_secundaria || '#8b5cf6',
        });
        setBlocks((data.layout_json || []) as unknown as Block[]);
      } else {
        // Gerar slug inicial baseado no nome do gabinete
        const { data: slugData } = await supabase.rpc(
          'generate_portal_slug',
          { gabinete_nome: currentGabinete.gabinetes.nome }
        );
        
        setFormData(prev => ({
          ...prev,
          slug: slugData || '',
          titulo: currentGabinete.gabinetes.nome || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar portal:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as configurações do portal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentGabinete) return;

    if (!formData.slug.trim()) {
      toast({
        title: 'Slug obrigatório',
        description: 'O slug do portal é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const portalData = {
        gabinete_id: currentGabinete.gabinetes.id,
        ...formData,
        layout_json: blocks as any,
      };

      if (portal) {
        // Atualizar
        const { error } = await supabase
          .from('portal_gabinete')
          .update(portalData)
          .eq('id', portal.id);

        if (error) throw error;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('portal_gabinete')
          .insert(portalData)
          .select()
          .single();

        if (error) throw error;
        setPortal(data);
      }

      toast({
        title: 'Salvo com sucesso!',
        description: 'As configurações do portal foram salvas.',
      });

      loadPortal();
    } catch (error: any) {
      console.error('Erro ao salvar portal:', error);
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
    if (!portal) {
      toast({
        title: 'Salve primeiro',
        description: 'Você precisa salvar as configurações antes de publicar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('portal_gabinete')
        .update({ publicado: !portal.publicado })
        .eq('id', portal.id);

      if (error) throw error;

      toast({
        title: portal.publicado ? 'Portal despublicado' : 'Portal publicado!',
        description: portal.publicado 
          ? 'Seu portal não está mais visível publicamente.'
          : 'Seu portal está agora visível publicamente.',
      });

      loadPortal();
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast({
        title: 'Erro ao publicar',
        description: 'Não foi possível alterar o status de publicação.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const portalUrl = `${window.location.origin}/portal/${formData.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Construtor de Sites
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie o portal público do seu gabinete
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {portal?.publicado && (
            <Badge variant="default" className="gap-1">
              <Globe className="h-3 w-3" />
              Publicado
            </Badge>
          )}
          {portal && !portal.publicado && (
            <Badge variant="secondary">Rascunho</Badge>
          )}
        </div>
      </div>

      {/* URL Preview */}
      {portal && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">URL do Portal</Label>
                <p className="text-sm font-mono mt-1 break-all">{portalUrl}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(portalUrl, '_blank')}
                disabled={!portal.publicado}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">
            <Layout className="h-4 w-4 mr-2" />
            Editor
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

        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais do seu portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Portal *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Gabinete da Vereadora Claudinha"
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
                <Label htmlFor="slug">Slug (URL) *</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                    {window.location.origin}/portal/
                  </span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                    }))}
                    placeholder="claudinha-jardim"
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
                Personalize as cores do seu portal
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
              onClick={loadPortal}
              disabled={saving}
            >
              Descartar alterações
            </Button>
            
            <div className="flex gap-2">
              {portal && (
                <Button
                  variant={portal.publicado ? "secondary" : "default"}
                  onClick={handlePublish}
                  disabled={saving}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {portal.publicado ? 'Despublicar' : 'Publicar Portal'}
                </Button>
              )}
              
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
