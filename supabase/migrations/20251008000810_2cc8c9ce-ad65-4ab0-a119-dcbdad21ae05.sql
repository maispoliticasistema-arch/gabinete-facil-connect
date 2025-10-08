-- Adicionar campos para assistente de roteiros em roteiros
ALTER TABLE roteiros 
ADD COLUMN IF NOT EXISTS buffer_deslocamento_minutos integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS buffer_parada_minutos integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS hora_limite_retorno time,
ADD COLUMN IF NOT EXISTS considera_trafego boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS otimizado boolean DEFAULT false;

-- Adicionar campos para ETAs e duração em roteiro_pontos
ALTER TABLE roteiro_pontos
ADD COLUMN IF NOT EXISTS duracao_prevista_minutos integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS janela_inicio time,
ADD COLUMN IF NOT EXISTS janela_fim time,
ADD COLUMN IF NOT EXISTS eta_chegada timestamp with time zone,
ADD COLUMN IF NOT EXISTS eta_inicio_atendimento timestamp with time zone,
ADD COLUMN IF NOT EXISTS eta_fim_atendimento timestamp with time zone,
ADD COLUMN IF NOT EXISTS tempo_deslocamento_minutos integer,
ADD COLUMN IF NOT EXISTS fixado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS conflito_janela boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS atraso_minutos integer DEFAULT 0;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_roteiro_pontos_roteiro_ordem ON roteiro_pontos(roteiro_id, ordem);
CREATE INDEX IF NOT EXISTS idx_roteiro_pontos_visitado ON roteiro_pontos(roteiro_id, visitado);

COMMENT ON COLUMN roteiros.buffer_deslocamento_minutos IS 'Buffer adicional para deslocamento (estacionamento, trânsito)';
COMMENT ON COLUMN roteiros.buffer_parada_minutos IS 'Buffer adicional por parada';
COMMENT ON COLUMN roteiros.hora_limite_retorno IS 'Horário máximo de retorno ao gabinete';
COMMENT ON COLUMN roteiros.considera_trafego IS 'Se deve considerar tráfego no cálculo de rotas';
COMMENT ON COLUMN roteiros.otimizado IS 'Se a ordem das paradas foi otimizada pelo assistente';

COMMENT ON COLUMN roteiro_pontos.duracao_prevista_minutos IS 'Tempo estimado de duração da visita/reunião';
COMMENT ON COLUMN roteiro_pontos.janela_inicio IS 'Horário mais cedo para começar (time window)';
COMMENT ON COLUMN roteiro_pontos.janela_fim IS 'Horário mais tarde para começar (time window)';
COMMENT ON COLUMN roteiro_pontos.eta_chegada IS 'Horário estimado de chegada';
COMMENT ON COLUMN roteiro_pontos.eta_inicio_atendimento IS 'Horário estimado de início do atendimento';
COMMENT ON COLUMN roteiro_pontos.eta_fim_atendimento IS 'Horário estimado de fim do atendimento';
COMMENT ON COLUMN roteiro_pontos.tempo_deslocamento_minutos IS 'Tempo de deslocamento do ponto anterior';
COMMENT ON COLUMN roteiro_pontos.fixado IS 'Se esta parada está fixada e não deve ser reordenada';
COMMENT ON COLUMN roteiro_pontos.conflito_janela IS 'Se há conflito com a janela de tempo';
COMMENT ON COLUMN roteiro_pontos.atraso_minutos IS 'Minutos de atraso em relação ao planejado';