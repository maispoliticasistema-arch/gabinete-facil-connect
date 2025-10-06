-- Corrigir política RLS de criação de gabinetes

-- Remover política antiga
DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON gabinetes;

-- Criar nova política mais específica
CREATE POLICY "Usuários autenticados podem criar gabinetes"
ON gabinetes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Adicionar política UPDATE para admins
CREATE POLICY "Admins podem atualizar informações do gabinete"
ON gabinetes
FOR UPDATE
USING (user_is_gabinete_admin(id))
WITH CHECK (user_is_gabinete_admin(id));