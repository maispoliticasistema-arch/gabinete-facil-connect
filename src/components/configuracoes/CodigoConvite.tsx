import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { Copy, RefreshCw } from 'lucide-react';

export const CodigoConvite = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState((currentGabinete?.gabinetes as any)?.codigo_convite || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codigo);
    toast({
      title: 'Código copiado!',
      description: 'O código de convite foi copiado para a área de transferência.',
    });
  };

  const handleRegenerate = async () => {
    if (!currentGabinete?.gabinete_id) return;

    try {
      setLoading(true);
      
      // Chamar função RPC para gerar novo código
      const { data: novoCodigo, error } = await supabase
        .rpc('generate_codigo_convite');

      if (error) throw error;

      // Atualizar gabinete com novo código
      const { error: updateError } = await supabase
        .from('gabinetes')
        .update({ codigo_convite: novoCodigo })
        .eq('id', currentGabinete.gabinete_id);

      if (updateError) throw updateError;

      setCodigo(novoCodigo);
      toast({
        title: 'Código renovado!',
        description: 'Um novo código de convite foi gerado.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao renovar código',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código de Convite do Gabinete</CardTitle>
        <CardDescription>
          Compartilhe este código com assessores para que eles possam solicitar acesso ao gabinete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Código de Convite</Label>
          <div className="flex gap-2">
            <Input 
              value={codigo} 
              readOnly 
              className="font-mono text-lg font-bold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copiar código"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerate}
              disabled={loading}
              title="Gerar novo código"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          💡 Novos assessores podem usar este código na tela de cadastro para solicitar acesso ao gabinete.
        </p>
      </CardContent>
    </Card>
  );
};
