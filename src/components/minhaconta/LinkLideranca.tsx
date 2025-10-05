import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Users } from 'lucide-react';

export function LinkLideranca() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codigoIndicacao, setCodigoIndicacao] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [totalIndicados, setTotalIndicados] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCodigo = async () => {
      setLoading(true);
      try {
        // Buscar código de indicação do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('codigo_indicacao')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setCodigoIndicacao(profile?.codigo_indicacao || '');

        // Buscar total de indicados via link
        const { count } = await supabase
          .from('eleitores')
          .select('*', { count: 'exact', head: true })
          .eq('cadastrado_por', user.id)
          .eq('via_link_indicacao', true);

        setTotalIndicados(count || 0);
      } catch (error) {
        console.error('Erro ao buscar código de indicação:', error);
        toast({
          title: 'Erro ao carregar link',
          description: 'Não foi possível carregar seu link de liderança.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCodigo();
  }, [user, toast]);

  const linkCompleto = `${window.location.origin}/cadastro-publico?ref=${codigoIndicacao}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkCompleto);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoIndicacao);
    toast({
      title: 'Código copiado!',
      description: 'O código foi copiado para a área de transferência.',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link de Liderança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Link de Liderança
        </CardTitle>
        <CardDescription>
          Compartilhe seu link para que pessoas possam se cadastrar através de você
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="rounded-lg bg-primary/5 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{totalIndicados}</p>
            <p className="text-sm text-muted-foreground">
              {totalIndicados === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'} através do seu link
            </p>
          </div>
        </div>

        {/* Código de indicação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Seu código de indicação</label>
          <div className="flex gap-2">
            <Input
              value={codigoIndicacao}
              readOnly
              className="font-mono text-lg"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copiarCodigo}
              title="Copiar código"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Link completo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Link completo para compartilhar</label>
          <div className="flex gap-2">
            <Input
              value={linkCompleto}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copiarLink}
              title="Copiar link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(linkCompleto, '_blank')}
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="font-semibold text-sm">Como funciona?</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Compartilhe seu link com conhecidos</li>
            <li>Quando alguém se cadastrar através do link, você receberá o crédito</li>
            <li>Os cadastros serão contabilizados no ranking de assessores</li>
            <li>Acompanhe seu desempenho na aba "Ranking" do dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
