import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Gabinete {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  cargo: string;
  created_at: string;
  usuariosCount: number;
  eleitoresCount: number;
  demandasCount: number;
}

export function GabinetesSection() {
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGabinetes() {
      try {
        const { data: gabinetesData, error } = await supabase
          .from('gabinetes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Para cada gabinete, buscar contagens
        const gabinetesComContagens = await Promise.all(
          (gabinetesData || []).map(async (gab) => {
            const [usuarios, eleitores, demandas] = await Promise.all([
              supabase
                .from('user_gabinetes')
                .select('*', { count: 'exact', head: true })
                .eq('gabinete_id', gab.id)
                .eq('ativo', true),
              supabase
                .from('eleitores')
                .select('*', { count: 'exact', head: true })
                .eq('gabinete_id', gab.id),
              supabase
                .from('demandas')
                .select('*', { count: 'exact', head: true })
                .eq('gabinete_id', gab.id)
            ]);

            return {
              ...gab,
              usuariosCount: usuarios.count || 0,
              eleitoresCount: eleitores.count || 0,
              demandasCount: demandas.count || 0
            };
          })
        );

        setGabinetes(gabinetesComContagens);
      } catch (error) {
        console.error('Erro ao carregar gabinetes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGabinetes();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gabinetes</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Gabinetes</CardTitle>
        <CardDescription>
          Lista completa de gabinetes cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Eleitores</TableHead>
              <TableHead>Demandas</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gabinetes.map((gab) => (
              <TableRow key={gab.id}>
                <TableCell className="font-medium">{gab.nome}</TableCell>
                <TableCell>
                  {gab.cidade && gab.estado ? `${gab.cidade} - ${gab.estado}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{gab.cargo || '-'}</Badge>
                </TableCell>
                <TableCell>{gab.usuariosCount}</TableCell>
                <TableCell>{gab.eleitoresCount}</TableCell>
                <TableCell>{gab.demandasCount}</TableCell>
                <TableCell>
                  {format(new Date(gab.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
