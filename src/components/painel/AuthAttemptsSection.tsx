import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, Calendar, Mail, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuthAttempt {
  id: string;
  email: string;
  success: boolean;
  error_message: string | null;
  user_agent: string | null;
  created_at: string;
}

export const AuthAttemptsSection = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<AuthAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    fetchAttempts();
  }, [filter]);

  const fetchAttempts = async () => {
    try {
      let query = supabase
        .from('auth_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'success') {
        query = query.eq('success', true);
      } else if (filter === 'failed') {
        query = query.eq('success', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttempts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar tentativas de autenticação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(attempt =>
    searchEmail ? attempt.email.toLowerCase().includes(searchEmail.toLowerCase()) : true
  );

  const successCount = attempts.filter(a => a.success).length;
  const failedCount = attempts.filter(a => !a.success).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attempts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins Bem-sucedidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas Falhadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Tentativas de Autenticação</CardTitle>
          <CardDescription>
            Monitore todas as tentativas de login no sistema (últimas 100)
          </CardDescription>
          <div className="flex gap-2 pt-4">
            <div className="flex-1">
              <Label>Buscar por email</Label>
              <Input
                placeholder="Digite o email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Filtrar</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falhadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <Button onClick={fetchAttempts} variant="outline">
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredAttempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma tentativa encontrada
                </p>
              ) : (
                filteredAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {attempt.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium truncate">{attempt.email}</p>
                          <Badge variant={attempt.success ? 'default' : 'destructive'}>
                            {attempt.success ? 'Sucesso' : 'Falha'}
                          </Badge>
                        </div>
                        
                        {attempt.error_message && (
                          <p className="text-sm text-red-600 mt-1">{attempt.error_message}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(attempt.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
