import { supabase } from "@/integrations/supabase/client";

interface LogAuthAttemptParams {
  email: string;
  success: boolean;
  errorMessage?: string;
  userId?: string;
}

/**
 * Registra tentativas de autenticação (sucesso ou falha)
 */
export async function logAuthAttempt({
  email,
  success,
  errorMessage,
  userId
}: LogAuthAttemptParams) {
  try {
    const { error } = await supabase
      .from('auth_attempts')
      .insert({
        email,
        success,
        error_message: errorMessage || null,
        user_id: userId || null,
        user_agent: navigator.userAgent,
        ip_address: null // IP será capturado pelo Supabase se possível
      });

    if (error) {
      console.error('Erro ao registrar tentativa de autenticação:', error);
    }
  } catch (error) {
    console.error('Falha ao registrar tentativa de autenticação:', error);
  }
}
