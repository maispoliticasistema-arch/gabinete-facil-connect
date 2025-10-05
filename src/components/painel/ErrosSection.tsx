import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle, AlertTriangle, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SystemError {
  id: string;
  created_at: string;
  error_message: string;
  error_code: string | null;
  stack_trace: string | null;
  context: any;
  severity: 'error' | 'warning' | 'critical';
  resolved: boolean;
  user_nome: string;
  gabinete_nome: string;
  page_url: string | null;
}

export function ErrosSection() {
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const { toast } = useToast();

  async function simulateError() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('system_errors').insert({
        error_message: '🔴 ERRO DE TESTE - Este é um erro simulado para testar o sistema de monitoramento',
        error_code: 'TEST_ERROR',
        severity: 'warning',
        user_id: user?.id,
        context: {
          teste: true,
          timestamp: new Date().toISOString(),
          simulacao: 'Erro gerado pelo botão de teste no painel'
        }
      });

      if (error) throw error;

      toast({
        title: "Erro simulado criado!",
        description: "O erro de teste foi registrado no sistema."
      });

      loadErrors();
    } catch (error) {
      console.error('Erro ao simular:', error);
      toast({
        title: "Erro ao simular",
        description: "Não foi possível criar o erro de teste.",
        variant: "destructive"
      });
    }
  }

  useEffect(() => {
    loadErrors();

    // Real-time para novos erros
    const channel = supabase
      .channel('system-errors-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_errors'
        },
        () => {
          loadErrors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function loadErrors() {
    try {
      let query = supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unresolved') {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes de usuários e gabinetes
      const errorsComNomes = await Promise.all(
        (data || []).map(async (err: any) => {
          const [userResult, gabResult] = await Promise.all([
            err.user_id ? supabase
              .from('profiles')
              .select('nome_completo')
              .eq('id', err.user_id)
              .single() : Promise.resolve({ data: null }),
            err.gabinete_id ? supabase
              .from('gabinetes')
              .select('nome')
              .eq('id', err.gabinete_id)
              .single() : Promise.resolve({ data: null })
          ]);

          return {
            ...err,
            user_nome: userResult.data?.nome_completo || 'Sistema',
            gabinete_nome: gabResult.data?.nome || '-'
          };
        })
      );

      setErrors(errorsComNomes);
    } catch (error) {
      console.error('Erro ao carregar erros do sistema:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsResolved(errorId: string) {
    try {
      const { error } = await supabase
        .from('system_errors')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', errorId);

      if (error) throw error;

      await loadErrors();
      setSelectedError(null);
    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'secondary'
    };
    return <Badge variant={variants[severity] || 'outline'}>{severity}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erros do Sistema</CardTitle>
          <CardDescription>Carregando erros...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Erros do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Monitoramento de erros em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateError}
            className="gap-2"
          >
            <Bug className="h-4 w-4" />
            Simular Erro
          </Button>
          <Button
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unresolved')}
          >
            Não Resolvidos ({errors.filter(e => !e.resolved).length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Gabinete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum erro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((error) => (
                  <TableRow key={error.id} className={error.resolved ? 'opacity-50' : ''}>
                    <TableCell>
                      {getSeverityIcon(error.severity)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(error.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {error.error_message}
                    </TableCell>
                    <TableCell className="text-sm">{error.user_nome}</TableCell>
                    <TableCell className="text-sm">{error.gabinete_nome}</TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedError(error)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && getSeverityIcon(selectedError.severity)}
              Detalhes do Erro
            </DialogTitle>
            <DialogDescription>
              {selectedError && format(new Date(selectedError.created_at), 'PPpp', { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Mensagem</h4>
                <p className="text-sm bg-muted p-3 rounded">{selectedError.error_message}</p>
              </div>

              {selectedError.page_url && (
                <div>
                  <h4 className="font-semibold mb-2">URL</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.page_url}</p>
                </div>
              )}

              {selectedError.stack_trace && (
                <div>
                  <h4 className="font-semibold mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {selectedError.context && (
                <div>
                  <h4 className="font-semibold mb-2">Contexto</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Usuário: {selectedError.user_nome}</p>
                  <p>Gabinete: {selectedError.gabinete_nome}</p>
                </div>
                {!selectedError.resolved && (
                  <Button onClick={() => markAsResolved(selectedError.id)}>
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
