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
        // Buscar todos os usuários do auth.users via metadata
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        
        // Buscar todos os profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Criar mapa de profiles por ID
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Para cada usuário do auth, buscar seus gabinetes e combinar com profile
        const usuariosCompletos = await Promise.all(
          (authUsers?.users || []).map(async (authUser) => {
            const profile = profileMap.get(authUser.id);
            
            const { data: userGabs } = await supabase
              .from('user_gabinetes')
              .select(`
                role,
                ativo,
                gabinete_id,
                gabinetes (nome)
              `)
              .eq('user_id', authUser.id);

            return {
              id: authUser.id,
              nome_completo: profile?.nome_completo || authUser.email || 'Sem nome',
              email: authUser.email,
              telefone: profile?.telefone,
              created_at: authUser.created_at,
              gabinetes: (userGabs || []).map((ug: any) => ({
                nome: ug.gabinetes?.nome || 'Desconhecido',
                role: ug.role,
                ativo: ug.ativo
              }))
            };
          })
        );

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
