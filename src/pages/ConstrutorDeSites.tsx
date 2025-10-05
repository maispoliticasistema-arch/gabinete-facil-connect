import { useEffect, useState } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Eye, Save, Palette, Layout } from 'lucide-react';

interface PortalConfig {
  id?: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  cor_primaria: string;
  cor_secundaria: string;
  publicado: boolean;
}

const ConstrutorDeSites = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalConfig, setPortalConfig] = useState<PortalConfig>({
    slug: '',
    titulo: '',
    subtitulo: '',
    descricao: '',
    cor_primaria: '#6366f1',
    cor_secundaria: '#8b5cf6',
    publicado: false,
  });

  useEffect(() => {
    if (!currentGabinete) return;

    const loadPortalConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('portal_gabinete')
          .select('*')
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPortalConfig({
            id: data.id,
            slug: data.slug,
            titulo: data.titulo || '',
            subtitulo: data.subtitulo || '',
            descricao: data.descricao || '',
            cor_primaria: data.cor_primaria || '#6366f1',
            cor_secundaria: data.cor_secundaria || '#8b5cf6',
            publicado: data.publicado,
          });
        } else {
          // Gerar slug inicial baseado no nome do gabinete
          const { data: slugData } = await supabase.rpc('generate_portal_slug', {
            gabinete_nome: currentGabinete.gabinetes.nome,
          });

          setPortalConfig((prev) => ({
            ...prev,
            slug: slugData || '',
            titulo: currentGabinete.gabinetes.nome,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar configuração do portal:', error);
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar as configurações do portal.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPortalConfig();
  }, [currentGabinete, toast]);

  const handleSave = async () => {
    if (!currentGabinete) return;

    if (!portalConfig.titulo || !portalConfig.slug) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o slug do portal.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (portalConfig.id) {
        // Atualizar existente
        const { error } = await supabase
          .from('portal_gabinete')
          .update({
            titulo: portalConfig.titulo,
            subtitulo: portalConfig.subtitulo,
            descricao: portalConfig.descricao,
            cor_primaria: portalConfig.cor_primaria,
            cor_secundaria: portalConfig.cor_secundaria,
          })
          .eq('id', portalConfig.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('portal_gabinete')
          .insert({
            gabinete_id: currentGabinete.gabinete_id,
            slug: portalConfig.slug,
            titulo: portalConfig.titulo,
            subtitulo: portalConfig.subtitulo,
            descricao: portalConfig.descricao,
            cor_primaria: portalConfig.cor_primaria,
            cor_secundaria: portalConfig.cor_secundaria,
          })
          .select()
          .single();

        if (error) throw error;

        setPortalConfig((prev) => ({ ...prev, id: data.id }));
      }

      toast({
        title: 'Salvo com sucesso!',
        description: 'As configurações do portal foram atualizadas.',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portalConfig.id) {
      toast({
        title: 'Salve antes de publicar',
        description: 'Você precisa salvar as configurações antes de publicar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_gabinete')
        .update({ publicado: !portalConfig.publicado })
        .eq('id', portalConfig.id);

      if (error) throw error;

      setPortalConfig((prev) => ({ ...prev, publicado: !prev.publicado }));

      toast({
        title: portalConfig.publicado ? 'Portal despublicado' : 'Portal publicado!',
        description: portalConfig.publicado
          ? 'Seu portal não está mais visível publicamente.'
          : 'Seu portal está agora visível publicamente.',
      });
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast({
        title: 'Erro ao publicar',
        description: 'Não foi possível alterar o status de publicação.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const portalUrl = `${window.location.origin}/portal/${portalConfig.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layout className="h-8 w-8" />
            Construtor de Sites
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie o portal público do seu gabinete
          </p>
        </div>
        <div className="flex gap-2">
          {portalConfig.publicado && (
            <Button
              variant="outline"
              onClick={() => window.open(portalUrl, '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Visualizar Portal
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Status e URL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Status do Portal
              </CardTitle>
              <CardDescription>
                Gerencie a visibilidade do seu portal público
              </CardDescription>
            </div>
            <Badge variant={portalConfig.publicado ? 'default' : 'secondary'}>
              {portalConfig.publicado ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Portal</Label>
            <div className="flex gap-2">
              <Input value={portalUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl);
                  toast({ title: 'URL copiada!' });
                }}
              >
                Copiar
              </Button>
            </div>
          </div>

          <Button
            onClick={handlePublish}
            variant={portalConfig.publicado ? 'destructive' : 'default'}
            disabled={saving || !portalConfig.id}
            className="w-full"
          >
            {portalConfig.publicado ? 'Despublicar Portal' : 'Publicar Portal'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Configure as informações principais do seu portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título do Portal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              value={portalConfig.titulo}
              onChange={(e) =>
                setPortalConfig((prev) => ({ ...prev, titulo: e.target.value }))
              }
              placeholder="Ex: Vereador João Silva"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitulo">Subtítulo</Label>
            <Input
              id="subtitulo"
              value={portalConfig.subtitulo}
              onChange={(e) =>
                setPortalConfig((prev) => ({ ...prev, subtitulo: e.target.value }))
              }
              placeholder="Ex: Trabalhando por um futuro melhor"
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={portalConfig.descricao}
              onChange={(e) =>
                setPortalConfig((prev) => ({ ...prev, descricao: e.target.value }))
              }
              placeholder="Descreva o trabalho e objetivos do mandato..."
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug (URL) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              value={portalConfig.slug}
              readOnly
              className="font-mono bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O slug é gerado automaticamente e não pode ser alterado após a criação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cores e Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Identidade Visual
          </CardTitle>
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
                  type="color"
                  id="cor_primaria"
                  value={portalConfig.cor_primaria}
                  onChange={(e) =>
                    setPortalConfig((prev) => ({
                      ...prev,
                      cor_primaria: e.target.value,
                    }))
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={portalConfig.cor_primaria}
                  onChange={(e) =>
                    setPortalConfig((prev) => ({
                      ...prev,
                      cor_primaria: e.target.value,
                    }))
                  }
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_secundaria">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="cor_secundaria"
                  value={portalConfig.cor_secundaria}
                  onChange={(e) =>
                    setPortalConfig((prev) => ({
                      ...prev,
                      cor_secundaria: e.target.value,
                    }))
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={portalConfig.cor_secundaria}
                  onChange={(e) =>
                    setPortalConfig((prev) => ({
                      ...prev,
                      cor_secundaria: e.target.value,
                    }))
                  }
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Preview das Cores</p>
            <div className="flex gap-2">
              <div
                className="h-16 flex-1 rounded"
                style={{ backgroundColor: portalConfig.cor_primaria }}
              />
              <div
                className="h-16 flex-1 rounded"
                style={{ backgroundColor: portalConfig.cor_secundaria }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Em breve: Editor de Blocos */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Editor de Blocos</CardTitle>
          <CardDescription>Em breve você poderá adicionar e editar blocos do portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade em desenvolvimento</p>
            <p className="text-sm mt-2">
              Em breve você poderá arrastar e editar blocos como Hero, Projetos, Notícias e muito mais!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConstrutorDeSites;
