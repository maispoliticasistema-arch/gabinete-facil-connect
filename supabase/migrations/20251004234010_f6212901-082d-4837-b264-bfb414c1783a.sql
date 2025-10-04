-- ============================================
-- ATUALIZAR RLS POLICIES COM VERIFICAÇÃO DE PERMISSÕES
-- ============================================

-- ============================================
-- TABELA: eleitores
-- ============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários podem ver eleitores dos seus gabinetes" ON eleitores;
DROP POLICY IF EXISTS "Usuários podem criar eleitores nos seus gabinetes" ON eleitores;
DROP POLICY IF EXISTS "Usuários podem atualizar eleitores dos seus gabinetes" ON eleitores;

-- Criar novas policies com verificação de permissões
CREATE POLICY "Usuários podem ver eleitores se tiverem permissão"
ON eleitores
FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_eleitores')
);

CREATE POLICY "Usuários podem criar eleitores se tiverem permissão"
ON eleitores
FOR INSERT
WITH CHECK (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'create_eleitores')
);

CREATE POLICY "Usuários podem atualizar eleitores se tiverem permissão"
ON eleitores
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'edit_eleitores')
);

CREATE POLICY "Usuários podem deletar eleitores se tiverem permissão"
ON eleitores
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_eleitores')
);

-- ============================================
-- TABELA: demandas
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver demandas dos seus gabinetes" ON demandas;
DROP POLICY IF EXISTS "Usuários podem criar demandas nos seus gabinetes" ON demandas;
DROP POLICY IF EXISTS "Usuários podem atualizar demandas dos seus gabinetes" ON demandas;

CREATE POLICY "Usuários podem ver demandas se tiverem permissão"
ON demandas
FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_demandas')
);

CREATE POLICY "Usuários podem criar demandas se tiverem permissão"
ON demandas
FOR INSERT
WITH CHECK (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'create_demandas')
);

CREATE POLICY "Usuários podem atualizar demandas se tiverem permissão"
ON demandas
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'edit_demandas')
);

CREATE POLICY "Usuários podem deletar demandas se tiverem permissão"
ON demandas
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_demandas')
);

-- ============================================
-- TABELA: agenda
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver agenda dos seus gabinetes" ON agenda;
DROP POLICY IF EXISTS "Usuários podem criar eventos nos seus gabinetes" ON agenda;
DROP POLICY IF EXISTS "Usuários podem atualizar eventos dos seus gabinetes" ON agenda;

CREATE POLICY "Usuários podem ver agenda se tiverem permissão"
ON agenda
FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_agenda')
);

CREATE POLICY "Usuários podem criar eventos se tiverem permissão"
ON agenda
FOR INSERT
WITH CHECK (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'create_agenda')
);

CREATE POLICY "Usuários podem atualizar eventos se tiverem permissão"
ON agenda
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'edit_agenda')
);

CREATE POLICY "Usuários podem deletar eventos se tiverem permissão"
ON agenda
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_agenda')
);

-- ============================================
-- TABELA: roteiros
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver roteiros dos seus gabinetes" ON roteiros;
DROP POLICY IF EXISTS "Usuários podem criar roteiros nos seus gabinetes" ON roteiros;
DROP POLICY IF EXISTS "Usuários podem atualizar roteiros dos seus gabinetes" ON roteiros;
DROP POLICY IF EXISTS "Usuários podem deletar roteiros dos seus gabinetes" ON roteiros;

CREATE POLICY "Usuários podem ver roteiros se tiverem permissão"
ON roteiros
FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_roteiros')
);

CREATE POLICY "Usuários podem criar roteiros se tiverem permissão"
ON roteiros
FOR INSERT
WITH CHECK (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'create_roteiros')
);

CREATE POLICY "Usuários podem atualizar roteiros se tiverem permissão"
ON roteiros
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'edit_roteiros')
);

CREATE POLICY "Usuários podem deletar roteiros se tiverem permissão"
ON roteiros
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_roteiros')
);