import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Play, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  requestsPerSecond: number;
  duration: number;
}

export function LoadTestSimulator() {
  const [endpoint, setEndpoint] = useState<string>('eleitores-list');
  const [users, setUsers] = useState<number>(10);
  const [duration, setDuration] = useState<number>(30);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult | null>(null);

  const endpoints = [
    { value: 'eleitores-list', label: 'Listar Eleitores', path: '/rest/v1/eleitores?select=*&limit=50' },
    { value: 'demandas-count', label: 'Contar Demandas', path: '/rest/v1/demandas?select=*&count=exact' },
    { value: 'agenda-today', label: 'Agenda de Hoje', path: '/rest/v1/agenda?select=*' },
    { value: 'metrics', label: 'Database Metrics', path: '/functions/v1/get-database-metrics' },
  ];

  const selectedEndpoint = endpoints.find(e => e.value === endpoint);

  const runLoadTest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    setResults(null);

    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    const requestsPerUser = Math.ceil((duration * 2) / users); // ~2 requisições por segundo dividido pelos usuários
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies: number[] = [];

    const makeRequest = async () => {
      const reqStart = Date.now();
      try {
        const response = await fetch(`https://vupyblqvmszzpyaddfda.supabase.co${selectedEndpoint?.path}`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cHlibHF2bXN6enB5YWRkZmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDI4NzQsImV4cCI6MjA3NTExODg3NH0.liE3k_zCrOBRmDunHGzwrKwWwwVMuCna_Du1cTmqUqE',
            'Content-Type': 'application/json'
          }
        });
        
        const reqEnd = Date.now();
        const latency = reqEnd - reqStart;
        
        totalRequests++;
        if (response.ok) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
        latencies.push(latency);
        
      } catch (error) {
        totalRequests++;
        failedRequests++;
      }
    };

    // Simular usuários concorrentes
    const userPromises = Array.from({ length: users }, async () => {
      while (Date.now() < endTime) {
        await makeRequest();
        // Delay aleatório entre 100-500ms para simular comportamento real
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
      }
    });

    // Atualizar progresso
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setProgress(progressPercent);
    }, 100);

    try {
      await Promise.all(userPromises);
      
      const actualDuration = (Date.now() - startTime) / 1000;
      
      // Calcular resultados
      const testResult: TestResult = {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageLatency: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
        minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
        requestsPerSecond: Math.round(totalRequests / actualDuration),
        duration: actualDuration
      };

      setResults(testResult);
      toast.success('Teste de carga concluído!');
      
    } catch (error) {
      console.error('Erro no teste de carga:', error);
      toast.error('Erro ao executar teste de carga');
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsRunning(false);
    }
  };

  const stopTest = () => {
    setIsRunning(false);
    setProgress(0);
    toast.info('Teste de carga interrompido');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Testes de Carga</CardTitle>
        <CardDescription>
          Execute testes de carga diretamente do navegador para simular múltiplos usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Testes muito agressivos podem afetar a performance do sistema. 
            Para testes pesados, use o Locust externamente.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Select value={endpoint} onValueChange={setEndpoint} disabled={isRunning}>
              <SelectTrigger id="endpoint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map(ep => (
                  <SelectItem key={ep.value} value={ep.value}>
                    {ep.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="users">Usuários Simultâneos</Label>
            <Input
              id="users"
              type="number"
              min="1"
              max="50"
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (segundos)</Label>
            <Input
              id="duration"
              type="number"
              min="10"
              max="120"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <Button onClick={runLoadTest} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Teste
            </Button>
          ) : (
            <Button onClick={stopTest} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Parar Teste
            </Button>
          )}
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Executando teste...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguarde enquanto o teste está sendo executado
            </div>
          </div>
        )}

        {results && !isRunning && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Resultados do Teste</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Requisições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.totalRequests}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.successfulRequests} sucessos / {results.failedRequests} falhas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Requisições/Segundo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.requestsPerSecond} RPS</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Latência Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.averageLatency}ms</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {results.minLatency}ms / Max: {results.maxLatency}ms
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
