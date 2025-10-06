import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

Deno.serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se o usuário que faz a requisição é superowner
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é superowner
    const { data: roles } = await supabaseAdmin
      .from('system_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superowner')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superowner access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar todos os usuários do auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    // Buscar profiles de todos os usuários
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*');

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Para cada usuário, buscar seus gabinetes
    const usuariosCompletos = await Promise.all(
      (authData.users || []).map(async (authUser) => {
        const profile = profileMap.get(authUser.id);
        
        const { data: userGabs } = await supabaseAdmin
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

    return new Response(
      JSON.stringify({ users: usuariosCompletos }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error listing users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
