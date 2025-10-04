import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Cliente admin para criar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, nome_completo, telefone, gabinete_id, role, permissions } = await req.json();

    // Validar campos obrigatórios
    if (!email || !password || !nome_completo || !gabinete_id || !role) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Criar usuário no Auth (sem enviar email de confirmação)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome_completo,
      },
    });

    if (authError) {
      console.error("Erro ao criar usuário no Auth:", authError);
      throw authError;
    }
    if (!authData.user) throw new Error("Erro ao criar usuário");

    console.log("Usuário criado no Auth:", authData.user.id);

    // 2. Garantir que o perfil existe (usando upsert)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ 
        id: authData.user.id,
        nome_completo,
        telefone
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error("Erro ao criar/atualizar perfil:", profileError);
      throw profileError;
    }

    // 4. Vincular ao gabinete (IMPORTANTE: ativo=true por padrão)
    const { data: userGabinete, error: ugError } = await supabaseAdmin
      .from("user_gabinetes")
      .insert({
        user_id: authData.user.id,
        gabinete_id,
        role,
        ativo: true, // Garantir que está ativo
      })
      .select()
      .single();

    if (ugError) {
      console.error("Erro ao vincular usuário ao gabinete:", ugError);
      throw ugError;
    }

    console.log("Usuário vinculado ao gabinete:", userGabinete.id);

    // 5. Adicionar permissões (se aplicável)
    if (role === "assessor" && permissions && permissions.length > 0) {
      const permissionsToInsert = permissions.map((permission: string) => ({
        user_gabinete_id: userGabinete.id,
        permission,
      }));

      const { error: permError } = await supabaseAdmin
        .from("user_permissions")
        .insert(permissionsToInsert);

      if (permError) {
        console.error("Erro ao adicionar permissões:", permError);
        throw permError;
      }

      console.log(`${permissions.length} permissões adicionadas`);
    }

    // 6. Registrar no log de auditoria
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        gabinete_id,
        user_id: authData.user.id,
        action: "user_created",
        entity_type: "user",
        entity_id: authData.user.id,
        details: { email, nome_completo, role },
      });

    console.log("Usuário criado com sucesso:", authData.user.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        userGabinete 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar usuário";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
