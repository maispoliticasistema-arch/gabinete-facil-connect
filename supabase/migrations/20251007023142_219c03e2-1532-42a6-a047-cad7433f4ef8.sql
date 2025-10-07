-- Corrigir funções que usam tipos incorretos de notificação
-- Primeiro, verificar quais são os tipos válidos e adicionar os que faltam se necessário

-- Buscar enum atual
DO $$ 
BEGIN
  -- Adicionar 'warning' se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'warning' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'warning';
  END IF;
  
  -- Adicionar 'info' se não existir  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'info' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'info';
  END IF;
END $$;