import { supabase } from "@/integrations/supabase/client";

type ErrorSeverity = 'error' | 'warning' | 'critical';

interface LogErrorParams {
  error: Error | string;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  gabineteId?: string;
}

/**
 * Registra erros do sistema para monitoramento no painel do superowner
 */
export async function logSystemError({
  error,
  severity = 'error',
  context,
  gabineteId
}: LogErrorParams) {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    const { error: insertError } = await supabase
      .from('system_errors')
      .insert({
        error_message: errorMessage,
        severity,
        stack_trace: stackTrace,
        context: context || null,
        gabinete_id: gabineteId || null,
        user_agent: navigator.userAgent,
        page_url: window.location.href
      });

    if (insertError) {
      console.error('Erro ao registrar erro no sistema:', insertError);
    }
  } catch (logError) {
    // Não queremos que o log de erro cause mais problemas
    console.error('Falha ao registrar erro:', logError);
  }
}

/**
 * Wrapper para executar uma função e registrar erros automaticamente
 */
export async function withErrorLogging<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    await logSystemError({
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'error',
      context
    });
    throw error; // Re-lança o erro para que o código chamador possa tratá-lo
  }
}
