# Como Usar o Error Logger

Este documento mostra como integrar o sistema de logging de erros nos componentes.

## Importação

```typescript
import { logSystemError } from '@/lib/errorLogger';
```

## Exemplo 1: Em um try-catch simples

```typescript
try {
  const { error } = await supabase
    .from('demandas')
    .insert(novaDemanda);
    
  if (error) throw error;
  
  toast({ title: "Demanda criada com sucesso!" });
} catch (error) {
  // Registra o erro no painel
  await logSystemError({
    error: error as Error,
    severity: 'error',
    context: {
      action: 'create_demanda',
      component: 'AddDemandaDialog',
      data: novaDemanda
    },
    gabineteId: currentGabinete.id
  });
  
  toast({
    title: "Erro ao criar demanda",
    description: error instanceof Error ? error.message : "Erro desconhecido",
    variant: "destructive",
  });
}
```

## Exemplo 2: Em operações críticas

```typescript
try {
  const { error } = await supabase
    .from('eleitores')
    .delete()
    .eq('id', eleitoresIds);
    
  if (error) throw error;
} catch (error) {
  // Erros em exclusões em massa são críticos
  await logSystemError({
    error: error as Error,
    severity: 'critical', // Marcado como crítico
    context: {
      action: 'bulk_delete_eleitores',
      component: 'DeleteEleitoresDialog',
      affectedIds: eleitoresIds,
      count: eleitoresIds.length
    },
    gabineteId: currentGabinete.id
  });
  
  toast({
    title: "Erro crítico",
    description: "Não foi possível excluir os eleitores. O suporte foi notificado.",
    variant: "destructive",
  });
}
```

## Exemplo 3: Warnings (não são erros fatais)

```typescript
try {
  const result = await geocodeAddress(endereco);
  
  if (!result || !result.lat) {
    // Não é um erro fatal, mas queremos monitorar
    await logSystemError({
      error: 'Falha ao geocodificar endereço',
      severity: 'warning',
      context: {
        action: 'geocode_address',
        address: endereco,
        component: 'AddEleitoresDialog'
      },
      gabineteId: currentGabinete.id
    });
  }
} catch (error) {
  // Erro na API de geocodificação
  await logSystemError({
    error: error as Error,
    severity: 'error',
    context: {
      action: 'geocode_api_call',
      address: endereco
    },
    gabineteId: currentGabinete.id
  });
}
```

## Campos disponíveis

- **error**: O erro (pode ser Error ou string)
- **severity**: 'error' | 'warning' | 'critical'
- **context**: Qualquer objeto JSON com informações úteis
- **gabineteId**: ID do gabinete (opcional, mas recomendado)

## O que é registrado automaticamente

- Mensagem de erro
- Stack trace (se disponível)
- User agent do navegador
- URL da página
- ID do usuário (automático via auth)
- Timestamp

## Visualização no Painel

Todos os erros ficam visíveis em `/painel` na aba "Erros":
- Filtros por status (resolvidos/pendentes)
- Detalhes completos incluindo stack trace
- Possibilidade de marcar como resolvido
- Alertas em tempo real na visão geral
