# Testes de Carga com Locust

Este documento descreve como configurar e executar testes de carga no sistema usando [Locust](https://locust.io/).

## 📋 Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## 🚀 Instalação

1. **Instale o Python** (se ainda não tiver):
   - Windows: Baixe de [python.org](https://www.python.org/downloads/)
   - Linux: `sudo apt-get install python3 python3-pip`
   - macOS: `brew install python3`

2. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

## ⚙️ Configuração

Antes de executar os testes, você precisa configurar um usuário de teste no arquivo `locustfile.py`:

```python
# Localize estas variáveis no arquivo locustfile.py
TEST_USER_EMAIL = "seu-usuario-teste@example.com"
TEST_USER_PASSWORD = "SuaSenhaSegura123!"
TEST_GABINETE_ID = "seu-gabinete-id"
```

### Criando um Usuário de Teste

**⚠️ IMPORTANTE**: Crie um usuário específico para testes de carga, não use credenciais de produção!

1. Acesse o sistema e crie um novo usuário
2. Anote o email e senha
3. Anote o ID do gabinete associado
4. Atualize as credenciais no `locustfile.py`

## 🎯 Executando os Testes

### Modo Interface Web (Recomendado)

```bash
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co
```

Depois acesse: http://localhost:8089

Na interface você pode configurar:
- **Number of users**: Número total de usuários simultâneos
- **Spawn rate**: Taxa de criação de novos usuários por segundo
- **Host**: URL do Supabase (já configurada)

### Modo Headless (Sem Interface)

Para testes automatizados em CI/CD:

```bash
locust -f locustfile.py \
  --host=https://vupyblqvmszzpyaddfda.supabase.co \
  --headless \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --html report.html
```

Parâmetros:
- `--users 100`: 100 usuários simultâneos
- `--spawn-rate 10`: Cria 10 novos usuários por segundo
- `--run-time 5m`: Executa por 5 minutos
- `--html report.html`: Gera relatório HTML

## 📊 Tipos de Usuários Disponíveis

O arquivo `locustfile.py` contém diferentes classes de usuários para testar cenários específicos:

### 1. EleitoresUser
Testa operações relacionadas a eleitores:
- ✅ Listar eleitores
- ✅ Contar eleitores
- ✅ Buscar por cidade
- ✅ Listar aniversariantes

### 2. DemandasUser
Testa operações de demandas:
- ✅ Listar demandas abertas
- ✅ Demandas vencendo hoje
- ✅ Demandas atrasadas

### 3. AgendaUser
Testa funcionalidades da agenda:
- ✅ Listar eventos do mês
- ✅ Contar eventos de hoje

### 4. PerformanceMetricsUser
Testa envio de métricas:
- ✅ Métricas de page load

### 5. EdgeFunctionsUser
Testa Edge Functions:
- ✅ Database metrics

### 6. MixedWorkloadUser (Padrão)
Simula fluxo real de usuário:
- ✅ Visualização de dashboard
- ✅ Gerenciamento de eleitores
- ✅ Consulta de agenda

## 🎭 Executando Tipos Específicos de Usuários

Por padrão, o Locust executa todos os tipos. Para testar apenas um tipo específico:

```bash
# Apenas testes de eleitores
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co EleitoresUser

# Apenas testes de demandas
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co DemandasUser

# Apenas fluxo misto (usuário real)
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co MixedWorkloadUser
```

## 📈 Interpretando os Resultados

### Métricas Principais

- **RPS (Requests per Second)**: Requisições por segundo
- **Response Time**: Tempo de resposta (50%, 95%, 99%)
- **Failures**: Taxa de falhas
- **Users**: Número de usuários simultâneos

### Limites Recomendados

| Métrica | Bom | Aceitável | Crítico |
|---------|-----|-----------|---------|
| Response Time (95%) | < 1s | 1-3s | > 3s |
| Error Rate | < 1% | 1-5% | > 5% |
| RPS | Variável | Variável | - |

## 🔍 Cenários de Teste Recomendados

### 1. Teste de Baseline
Estabelece performance normal:
```bash
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co --headless --users 10 --spawn-rate 2 --run-time 3m
```

### 2. Teste de Carga
Simula uso intenso:
```bash
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co --headless --users 100 --spawn-rate 10 --run-time 10m
```

### 3. Teste de Stress
Encontra limites do sistema:
```bash
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co --headless --users 500 --spawn-rate 50 --run-time 15m
```

### 4. Teste de Spike
Simula pico repentino:
```bash
locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co --headless --users 1000 --spawn-rate 100 --run-time 2m
```

## 🛡️ Boas Práticas

### ✅ Faça

- Use credenciais de teste dedicadas
- Execute testes em horários de baixo uso
- Monitore o Supabase Dashboard durante os testes
- Analise os relatórios gerados
- Compare resultados ao longo do tempo
- Documente mudanças que afetam performance

### ❌ Não Faça

- Usar credenciais de produção
- Executar testes sem avisar a equipe
- Ignorar alertas e limites do Supabase
- Executar testes muito agressivos sem preparação
- Testar diretamente em produção sem ambiente de staging

## 🐛 Solução de Problemas

### Erro: "401 Unauthorized"
- Verifique as credenciais de teste no `locustfile.py`
- Confirme que o usuário tem acesso ao gabinete configurado

### Erro: "429 Too Many Requests"
- Reduza o número de usuários ou spawn rate
- Verifique os limites da sua instância Supabase

### Performance Degradada
- Verifique índices no banco de dados
- Analise queries lentas no Supabase Dashboard
- Considere otimizar as RLS policies

## 📚 Recursos Adicionais

- [Documentação Oficial do Locust](https://docs.locust.io/)
- [Best Practices for Load Testing](https://docs.locust.io/en/stable/writing-a-locustfile.html)
- [Supabase Performance Tips](https://supabase.com/docs/guides/platform/performance)

## 🤝 Contribuindo

Para adicionar novos testes:

1. Identifique o fluxo ou endpoint a testar
2. Adicione uma nova classe ou `@task` no `locustfile.py`
3. Configure o peso apropriado (frequência de execução)
4. Documente o novo teste neste arquivo
5. Execute e valide os resultados

## 📞 Suporte

Para questões sobre os testes de carga, consulte a equipe de desenvolvimento.
