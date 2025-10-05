# Como Usar o Sistema de Monitoramento

Este documento explica como integrar o sistema de monitoramento avançado nos componentes.

## Importação

```typescript
import { trackPerformanceMetric, measurePerformance, trackSlowQuery } from '@/lib/performanceMonitor';
```

## 1. Rastreando Requisições de API

### Exemplo: Criar uma demanda

```typescript
import { measurePerformance } from '@/lib/performanceMonitor';

async function handleCreateDemanda(data: DemandaData) {
  try {
    await measurePerformance(
      async () => {
        const { error } = await supabase
          .from('demandas')
          .insert(data);
          
        if (error) throw error;
      },
      '/api/demandas/create',
      'api_request'
    );
    
    toast({ title: "Demanda criada!" });
  } catch (error) {
    console.error(error);
  }
}
```

## 2. Rastreando Queries Lentas do Banco

### Automático com Interceptor

O sistema já rastreia automaticamente queries do Supabase que demoram mais de 1 segundo.

### Manual

```typescript
import { trackSlowQuery } from '@/lib/performanceMonitor';

const startTime = performance.now();

const { data, error } = await supabase
  .from('eleitores')
  .select('*, tags(*)')
  .limit(1000);

const duration = performance.now() - startTime;

// Registra se for lenta
if (duration > 1000) {
  await trackSlowQuery(
    'SELECT eleitores with tags',
    duration,
    'eleitores',
    { 
      operation: 'select with join',
      limit: 1000 
    }
  );
}
```

## 3. Rastreando Performance de Página

Já está ativo automaticamente no `main.tsx` através de `trackPageLoad()`.

Ele registra:
- Tempo total de carregamento
- DOM Interactive
- DOM Content Loaded
- First Paint

## 4. Métricas Personalizadas

```typescript
import { trackPerformanceMetric } from '@/lib/performanceMonitor';

// Exemplo: Tempo de processamento de dados
const startTime = performance.now();

// Seu processamento aqui
const processedData = processarDados(rawData);

const duration = Math.round(performance.now() - startTime);

await trackPerformanceMetric({
  type: 'api_request', // ou 'db_query', 'page_load', 'error_rate'
  endpoint: '/data/process',
  durationMs: duration,
  statusCode: 200,
  gabineteId: currentGabinete.id,
  metadata: {
    recordCount: rawData.length,
    operation: 'data_processing'
  }
});
```

## 5. Criando Alertas Manuais

Os alertas são criados automaticamente pelo sistema quando detecta:
- Alta latência (> 1000ms)
- Taxa de erro elevada (> 10%)
- Múltiplas queries lentas (> 10 em 15min)

Mas você pode criar alertas manualmente se necessário:

```typescript
await supabase
  .from('system_alerts')
  .insert({
    alert_type: 'service_down',
    severity: 'critical',
    title: 'Serviço de Email Inativo',
    message: 'O serviço de envio de emails não está respondendo',
    metric_value: 0,
    threshold_value: 1
  });
```

## O que é Monitorado Automaticamente

✅ **Tempo de carregamento de página** - Registrado no load da página  
✅ **Queries do Supabase > 1s** - Detectadas automaticamente  
✅ **Métricas agregadas por hora** - Função `aggregate_hourly_metrics()` roda via cron  
✅ **Alertas automáticos** - Função `check_and_create_alerts()` roda periodicamente  

## Visualização no Painel

Todas as métricas ficam visíveis em `/painel` na aba **"Monitoramento"**:

### Tempo Real
- Latência média (últimos 5min)
- Requisições por minuto
- Taxa de erro
- Queries lentas
- Conexões ativas
- Cache hit rate

### Performance
- Gráficos de latência ao longo do tempo
- Volume de requisições
- Comparativo de erros e queries lentas

### Queries Lentas
- Tabela com últimas 50 queries > 1s
- Stack trace e contexto
- Usuário e gabinete

### Alertas
- Alertas ativos no topo da tela
- Possibilidade de marcar como resolvido
- Real-time para novos alertas

## Funções de Agregação e Alertas (Banco)

Para executar periodicamente, você pode configurar cron jobs:

```sql
-- Agregar métricas a cada hora
SELECT cron.schedule(
  'aggregate-hourly-metrics',
  '5 * * * *', -- 5 minutos após cada hora
  $$ SELECT aggregate_hourly_metrics(); $$
);

-- Verificar alertas a cada 5 minutos
SELECT cron.schedule(
  'check-system-alerts',
  '*/5 * * * *',
  $$ SELECT check_and_create_alerts(); $$
);
```

## Best Practices

1. **Não abuse do tracking** - Registre apenas operações importantes
2. **Use metadados** - Inclua contexto útil para debugging
3. **Monitore em produção** - O sistema é feito para ambiente live
4. **Resolva alertas** - Marque alertas como resolvidos após correção
5. **Analise queries lentas** - Crie índices quando necessário

## Próximos Passos

Para integração completa:
1. Adicionar tracking nas operações críticas (CRUD de eleitores, demandas, etc.)
2. Configurar cron jobs no Supabase
3. Monitorar o painel regularmente
4. Ajustar thresholds de alertas conforme necessário
