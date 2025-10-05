import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Usuario {
  id: string;
  nome_completo: string;
  created_at: string;
  gabinetes: Array<{
    nome: string;
    role: string;
    ativo: boolean;
  }>;
}

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsuarios() {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Para cada usuário, buscar seus gabinetes
        const usuariosComGabinetes = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { data: userGabs } = await supabase
              .from('user_gabinetes')
              .select(`
                role,
                ativo,
                gabinete_id,
                gabinetes (nome)
              `)
              .eq('user_id', profile.id);

            return {
              ...profile,
              gabinetes: (userGabs || []).map((ug: any) => ({
                nome: ug.gabinetes?.nome || 'Desconhecido',
                role: ug.role,
                ativo: ug.ativo
              }))
            };
          })
        );

        setUsuarios(usuariosComGabinetes);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUsuarios();
  }, []);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      owner: 'default',
      admin: 'secondary',
      assessor: 'outline'
    };
    return <Badge variant={colors[role] || 'outline'}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Usuários</CardTitle>
        <CardDescription>
          Lista completa de usuários cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Gabinetes</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nome_completo}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {user.gabinetes.length > 0 ? (
                      user.gabinetes.map((gab, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm">{gab.nome}</span>
                          {getRoleBadge(gab.role)}
                          {!gab.ativo && (
                            <Badge variant="destructive" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem gabinetes</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
