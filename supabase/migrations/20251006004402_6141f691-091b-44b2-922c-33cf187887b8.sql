-- Permitir criação de gabinetes para usuários anônimos (durante cadastro)

-- 1. GABINETES: Permitir anon e authenticated
DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON gabinetes;

CREATE POLICY "Qualquer um pode criar gabinetes"
ON gabinetes
FOR INSERT
WITH CHECK (true);

-- 2. USER_GABINETES: Permitir anon e authenticated
DROP POLICY IF EXISTS "Usuários podem se vincular aos gabinetes" ON user_gabinetes;

CREATE POLICY "Qualquer um pode se vincular aos gabinetes"
ON user_gabinetes
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR auth.uid() IS NOT NULL
);