-- Corrigir completamente as políticas RLS para permitir criação de gabinetes

-- 1. GABINETES: Remover e recriar políticas
DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON gabinetes;
DROP POLICY IF EXISTS "Admins podem atualizar informações do gabinete" ON gabinetes;
DROP POLICY IF EXISTS "Usuários podem ver gabinetes onde têm acesso" ON gabinetes;

-- Política de INSERT: qualquer usuário autenticado pode criar
CREATE POLICY "Usuários autenticados podem criar gabinetes"
ON gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de SELECT: ver gabinetes onde tem vínculo ativo
CREATE POLICY "Usuários podem ver seus gabinetes"
ON gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.ativo = true
  )
);

-- Política de UPDATE: apenas admins/owners podem atualizar
CREATE POLICY "Admins podem atualizar gabinete"
ON gabinetes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.role IN ('owner', 'admin')
      AND user_gabinetes.ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.role IN ('owner', 'admin')
      AND user_gabinetes.ativo = true
  )
);

-- 2. USER_GABINETES: Ajustar política de INSERT
DROP POLICY IF EXISTS "Usuários podem vincular-se aos gabinetes que criaram" ON user_gabinetes;

-- Permitir que usuários se vinculem aos gabinetes
CREATE POLICY "Usuários podem se vincular aos gabinetes"
ON user_gabinetes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);