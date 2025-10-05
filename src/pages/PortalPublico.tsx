import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PortalRenderer } from '@/components/construtor/PortalRenderer';
import { Block } from '@/components/construtor/BlockTypes';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PortalPublico = () => {
  const { gabinete_slug, site_path } = useParams<{ gabinete_slug: string; site_path: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portal, setPortal] = useState<any>(null);

  useEffect(() => {
    if (!gabinete_slug || !site_path) {
      setError('Parâmetros inválidos');
      setLoading(false);
      return;
    }

    loadPortal();
  }, [gabinete_slug, site_path]);

  const loadPortal = async () => {
    if (!gabinete_slug || !site_path) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar portal publicado pelo slug do gabinete e site_path
      const { data, error: fetchError } = await supabase
        .from('portal_gabinete')
        .select(`
          *,
          gabinetes (
            nome,
            slogan,
            cargo,
            cidade,
            estado
          )
        `)
        .eq('slug', gabinete_slug)
        .eq('site_path', site_path)
        .eq('publicado', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Site não encontrado ou não está publicado');
        return;
      }

      setPortal(data);

      // Set page title
      if (data.titulo) {
        document.title = data.titulo;
      }

      // Set meta description
      if (data.descricao) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', data.descricao);
      }

      // Set Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', data.titulo || data.gabinetes.nome);
      if (!document.querySelector('meta[property="og:title"]')) {
        document.head.appendChild(ogTitle);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', data.descricao || data.subtitulo || '');
      if (!document.querySelector('meta[property="og:description"]')) {
        document.head.appendChild(ogDescription);
      }

    } catch (err: any) {
      console.error('Erro ao carregar site:', err);
      setError(err.message || 'Erro ao carregar site');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando site...</p>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Site Não Encontrado</h1>
          <p className="text-muted-foreground">
            {error || 'O site que você está procurando não existe ou não está mais disponível.'}
          </p>
          <Button onClick={() => navigate('/inicio')}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const blocks = (portal.layout_json || []) as unknown as Block[];
  const colors = {
    primary: portal.cor_primaria || '#6366f1',
    secondary: portal.cor_secundaria || '#8b5cf6',
  };

  return (
    <PortalRenderer
      blocks={blocks}
      colors={colors}
      titulo={portal.titulo}
      gabineteId={portal.gabinete_id}
    />
  );
};

export default PortalPublico;
