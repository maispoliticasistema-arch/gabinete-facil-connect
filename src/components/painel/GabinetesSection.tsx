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
        // Buscar TODOS os gabinetes do sistema
        const { data: gabinetesData, error } = await supabase
          .from('gabinetes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`📊 Total de gabinetes no sistema: ${gabinetesData?.length || 0}`);

        // Buscar todas as contagens de uma vez para otimizar
        const gabineteIds = gabinetesData?.map(g => g.id) || [];
        
        const [usuariosData, eleitoresData, demandasData] = await Promise.all([
          supabase.from('user_gabinetes').select('gabinete_id').eq('ativo', true).in('gabinete_id', gabineteIds),
          supabase.from('eleitores').select('gabinete_id').in('gabinete_id', gabineteIds),
          supabase.from('demandas').select('gabinete_id').in('gabinete_id', gabineteIds)
        ]);

        // Contar por gabinete_id
        const countByGabinete = (data: any[]) => 
          data.reduce((acc, item) => {
            acc[item.gabinete_id] = (acc[item.gabinete_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const usuariosCounts = countByGabinete(usuariosData.data || []);
        const eleitoresCounts = countByGabinete(eleitoresData.data || []);
        const demandasCounts = countByGabinete(demandasData.data || []);

        const gabinetesComContagens = gabinetesData.map(gab => ({
          ...gab,
          usuariosCount: usuariosCounts[gab.id] || 0,
          eleitoresCount: eleitoresCounts[gab.id] || 0,
          demandasCount: demandasCounts[gab.id] || 0
        }));

        console.log('📊 Gabinetes processados:', gabinetesComContagens.length);
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
