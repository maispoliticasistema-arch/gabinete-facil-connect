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
  email?: string;
  telefone?: string;
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
        // Buscar TODOS os usuários do sistema (usando service role implicitamente via RLS)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Erro ao buscar profiles:', profilesError);
          throw profilesError;
        }

        // Buscar TODOS os gabinetes de uma vez
        const { data: allUserGabinetes, error: gabError } = await supabase
          .from('user_gabinetes')
          .select(`
            user_id,
            role,
            ativo,
            gabinetes (nome)
          `);

        if (gabError) {
          console.error('Erro ao buscar user_gabinetes:', gabError);
        }

        // Mapear gabinetes por user_id
        const gabinetesPorUsuario = (allUserGabinetes || []).reduce((acc: any, ug: any) => {
          if (!acc[ug.user_id]) {
            acc[ug.user_id] = [];
          }
          acc[ug.user_id].push({
            nome: ug.gabinetes?.nome || 'Desconhecido',
            role: ug.role,
            ativo: ug.ativo
          });
          return acc;
        }, {});

        const usuariosCompletos = profiles.map((profile) => ({
          id: profile.id,
          nome_completo: profile.nome_completo,
          email: profile.id,
          telefone: profile.telefone,
          created_at: profile.created_at,
          gabinetes: gabinetesPorUsuario[profile.id] || []
        }));

        console.log(`📊 Total de usuários carregados: ${usuariosCompletos.length}`);
        setUsuarios(usuariosCompletos);
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
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Gabinetes</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nome_completo}</TableCell>
                <TableCell className="text-sm">{user.email || '-'}</TableCell>
                <TableCell className="text-sm">{user.telefone || '-'}</TableCell>
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
