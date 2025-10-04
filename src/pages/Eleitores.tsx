import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { EleitoresTable } from '@/components/eleitores/EleitoresTable';
import { AddEleitoresDialog } from '@/components/eleitores/AddEleitoresDialog';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  created_at: string;
}

const Eleitores = () => {
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

  const fetchEleitores = async () => {
    if (!currentGabinete) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eleitores')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEleitores(data || []);
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

  useEffect(() => {
    fetchEleitores();
  }, [currentGabinete]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eleitores</h1>
          <p className="text-muted-foreground">
            Cadastro completo de eleitores e apoiadores
          </p>
        </div>
        <AddEleitoresDialog onEleitoresAdded={fetchEleitores} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Lista de Eleitores</CardTitle>
          </div>
          <CardDescription>
            {loading ? 'Carregando...' : `${eleitores.length} eleitor(es) cadastrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <EleitoresTable eleitores={eleitores} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Eleitores;
