# 🤖 Assistente Inteligente de Roteiros

Sistema de otimização automática de roteiros com cálculo de ETAs, time windows e visualização em timeline.

## 🎯 Funcionalidades

### 1. **Otimização Automática**
- Calcula a ordem mais eficiente de visitas usando heurística de vizinho mais próximo
- Respeita paradas fixadas pelo usuário
- Considera janelas de tempo (time windows) quando configuradas
- Minimiza tempo total de deslocamento

### 2. **Cálculo de ETAs (Estimated Time of Arrival)**
Para cada parada, calcula automaticamente:
- ⏱️ **ETA de Chegada**: Quando você chegará no local
- ▶️ **ETA de Início**: Quando começará o atendimento (respeitando time windows)
- ⏹️ **ETA de Término**: Quando terminará o atendimento
- 🚗 **Tempo de Deslocamento**: Duração da viagem até aquela parada

### 3. **Buffers Inteligentes**
- **Buffer de Deslocamento** (padrão: 10 min): Tempo extra para estacionar e trânsito
- **Buffer por Parada** (padrão: 5 min): Intervalo entre atendimentos
- Totalmente configurável pelo usuário

### 4. **Visualização em Timeline**
Interface intuitiva mostrando:
- Linha do tempo completa do roteiro
- Horários de saída e retorno previstos
- Status de cada parada (pendente, visitada, conflito)
- Distância total estimada
- Duração de cada atendimento

### 5. **Detecção de Conflitos**
O assistente identifica e alerta sobre:
- ⚠️ Violações de janelas de tempo
- 🚨 Impossibilidade de cumprir horários
- ⏰ Atrasos acumulados
- 📍 Horário de retorno ultrapassado

## 🚀 Como Usar

### Passo 1: Configurar Informações Básicas
1. Clique em "Criar Novo Roteiro"
2. Selecione aba "Assistente Inteligente"
3. Preencha:
   - Nome do roteiro
   - Data
   - **Hora de Saída** (obrigatório)
   - **Endereço de Partida** (obrigatório)

### Passo 2: Adicionar Paradas
1. Busque eleitores pelo nome ou endereço
2. Clique para adicionar ao roteiro
3. **Configure a duração** de cada parada (em minutos)
4. Opcionalmente, adicione endereços alternativos

### Passo 3: Configurar Buffers (Opcional)
Ajuste os buffers conforme necessário:
- **Buffer de Deslocamento**: Para áreas urbanas, use 10-15 min
- **Buffer por Parada**: Para conversas rápidas, use 5 min

### Passo 4: Otimizar
1. Clique no botão **"🤖 Otimizar Roteiro"**
2. O sistema processará:
   - Geocodificação de endereços
   - Matriz de distâncias via OSRM
   - Algoritmo de otimização
   - Cálculo de todos os ETAs

### Passo 5: Revisar Timeline
Após a otimização, você verá:
- ✅ Ordem otimizada das paradas
- ⏰ Horários calculados para cada visita
- ⚠️ Alertas de conflitos (se houver)
- 📊 Resumo com duração total e distância

### Passo 6: Salvar
Se estiver satisfeito com a otimização, clique em **"Salvar Roteiro"**.
O sistema armazenará:
- Ordem otimizada das paradas
- Todos os ETAs calculados
- Tempos de deslocamento
- Marcadores de conflito
- Distância e duração totais

## 🔧 Campos Técnicos Salvos no Banco

### Tabela `roteiros`
- `buffer_deslocamento_minutos`: Buffer aplicado aos deslocamentos
- `buffer_parada_minutos`: Buffer aplicado entre paradas
- `hora_limite_retorno`: Limite de retorno (opcional)
- `considera_trafego`: Se considerou tráfego no cálculo
- `otimizado`: Flag indicando se foi otimizado pelo assistente

### Tabela `roteiro_pontos`
- `duracao_prevista_minutos`: Tempo de duração da visita
- `janela_inicio/fim`: Janelas de tempo (opcional)
- `eta_chegada`: Timestamp de chegada prevista
- `eta_inicio_atendimento`: Início do atendimento
- `eta_fim_atendimento`: Fim do atendimento
- `tempo_deslocamento_minutos`: Tempo do ponto anterior
- `fixado`: Se a parada não deve ser reordenada
- `conflito_janela`: Se há violação de time window
- `atraso_minutos`: Minutos de atraso acumulado

## 🧠 Algoritmo de Otimização

### Heurística: Nearest Neighbor com Time Windows

1. **Preparação**:
   - Geocodifica todos os endereços
   - Obtém matriz de tempos de deslocamento via OSRM
   - Separa paradas fixas de paradas móveis

2. **Construção da Rota**:
   - Inicia da origem no horário especificado
   - Para cada posição:
     - Avalia todas as paradas não visitadas
     - Calcula tempo de chegada + custo de espera
     - Verifica viabilidade de time windows
     - Escolhe a parada mais próxima viável
     - Atualiza tempo acumulado

3. **Tratamento de Conflitos**:
   - Se não há parada viável, escolhe a mais próxima mesmo violando
   - Registra o conflito para exibição ao usuário
   - Calcula minutos de atraso

4. **Refinamento** (futuro):
   - 2-opt/3-opt local search
   - Reotimização ao marcar atrasos durante execução

## 🛣️ Serviços de Roteamento

### OSRM (Open Source Routing Machine)
- **Endpoint**: `https://router.project-osrm.org`
- **Usado para**: Matriz de tempos de deslocamento
- **Fallback**: Distância euclidiana se API falhar
- **Considera**: Vias reais, sentidos de mão, velocidades

### Nominatim (Geocoding)
- **Endpoint**: `https://nominatim.openstreetmap.org`
- **Usado para**: Converter endereços em coordenadas
- **Rate Limit**: 1 req/segundo
- **User-Agent**: `GabineteApp/1.0`

## 📱 Exemplos de Uso

### Cenário 1: Visitas Rápidas no Centro
```
Saída: 14:00 de Guaíba
Paradas:
  - Eleitor A (30 min) em Pelotas
  - Eleitor B (20 min) em Pelotas Centro
  - Eleitor C (45 min) em Rio Grande

Buffer Deslocamento: 10 min
Buffer Parada: 5 min

Resultado:
14:00 | Saída de Guaíba
15:50 | Chegada Eleitor B (mais próximo)
15:50-16:20 | Atendimento (30 min)
16:25 | Saída (5 min buffer)
16:40 | Chegada Eleitor A
16:40-17:00 | Atendimento (20 min)
17:05 | Saída
18:00 | Chegada Eleitor C
18:00-18:45 | Atendimento (45 min)
18:50 | Retorno previsto
```

### Cenário 2: Com Janela de Tempo
```
Eleitor D só pode receber entre 17:00-17:30

Se ETA calculado for 16:45:
  → Sistema espera até 17:00
  → Início do atendimento: 17:00
  
Se ETA calculado for 17:45:
  ⚠️ Conflito detectado! (+15 min atraso)
```

## 🔮 Melhorias Futuras

- [ ] Replanejamento em tempo real durante execução
- [ ] Integração com Google Maps Traffic API
- [ ] Suporte a múltiplos veículos (Vehicle Routing Problem)
- [ ] Export para Google Calendar/Outlook
- [ ] Compartilhamento via WhatsApp
- [ ] Mapa interativo com rota desenhada
- [ ] Histórico de roteiros realizados vs. planejados
- [ ] Métricas de eficiência (tempo real vs. estimado)

## 🎓 Referências Técnicas

- **VRP with Time Windows**: https://en.wikipedia.org/wiki/Vehicle_routing_problem
- **OSRM Documentation**: https://project-osrm.org
- **Nearest Neighbor Heuristic**: https://en.wikipedia.org/wiki/Nearest_neighbour_algorithm
- **2-opt Optimization**: https://en.wikipedia.org/wiki/2-opt

---

**Desenvolvido com ❤️ para tornar o planejamento de roteiros mais eficiente e inteligente!**
