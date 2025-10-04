-- ============================================
-- CORRIGIR RLS: Permitir assessores verem suas próprias permissões
-- ============================================

-- A política atual só permite owners e admins verem permissões
-- Precisamos adicionar uma política para assessores verem suas próprias permissões

-- Adicionar política para assessores verem suas próprias permissões
CREATE POLICY "Usuários podem ver suas próprias permissões"
ON user_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_gabinetes ug
    WHERE ug.id = user_permissions.user_gabinete_id
      AND ug.user_id = auth.uid()
      AND ug.ativo = true
  )
);