import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Ban, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Gabinete {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  user_count: number;
  status: 'ativo' | 'suspenso';
}

export function GabinetesTable() {
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGabinetes();
  }, []);

  const fetchGabinetes = async () => {
    try {
      const { data: gabinetesData, error: gabinetesError } = await supabase
        .from('gabinetes')
        .select('*')
        .order('created_at', { ascending: false });

      if (gabinetesError) throw gabinetesError;

      // Para cada gabinete, contar usuários
      const gabinetesComContagem = await Promise.all(
        (gabinetesData || []).map(async (gabinete) => {
          const { count } = await supabase
            .from('user_gabinetes')
            .select('*', { count: 'exact', head: true })
            .eq('gabinete_id', gabinete.id)
            .eq('ativo', true);

          return {
            ...gabinete,
            user_count: count || 0,
            status: 'ativo' as const
          };
        })
      );

      setGabinetes(gabinetesComContagem);
    } catch (error) {
      console.error('Erro ao buscar gabinetes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando gabinetes...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Usuários</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gabinetes.map((gabinete) => (
            <TableRow key={gabinete.id}>
              <TableCell className="font-medium">{gabinete.nome}</TableCell>
              <TableCell>
                {gabinete.cidade && gabinete.estado 
                  ? `${gabinete.cidade} / ${gabinete.estado}`
                  : '-'}
              </TableCell>
              <TableCell>
                {format(new Date(gabinete.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{gabinete.user_count}</TableCell>
              <TableCell>
                <Badge variant={gabinete.status === 'ativo' ? 'default' : 'destructive'}>
                  {gabinete.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Ban className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
