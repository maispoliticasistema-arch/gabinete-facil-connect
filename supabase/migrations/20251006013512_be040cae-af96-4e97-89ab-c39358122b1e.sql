-- Adicionar coluna deleted_at para soft delete nas tabelas principais

-- Eleitores
ALTER TABLE public.eleitores 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_eleitores_deleted_at ON public.eleitores(deleted_at) WHERE deleted_at IS NULL;

-- Demandas
ALTER TABLE public.demandas 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_demandas_deleted_at ON public.demandas(deleted_at) WHERE deleted_at IS NULL;

-- Agenda
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_deleted_at ON public.agenda(deleted_at) WHERE deleted_at IS NULL;

-- Roteiros
ALTER TABLE public.roteiros 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_roteiros_deleted_at ON public.roteiros(deleted_at) WHERE deleted_at IS NULL;

-- Tags
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tags_deleted_at ON public.tags(deleted_at) WHERE deleted_at IS NULL;

-- Atualizar policies para considerar soft delete

-- Eleitores - SELECT
DROP POLICY IF EXISTS "Usuários podem ver eleitores se tiverem permissão" ON public.eleitores;
CREATE POLICY "Usuários podem ver eleitores se tiverem permissão"
ON public.eleitores FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_eleitores'::permission_type)
  AND deleted_at IS NULL
);

-- Eleitores - DELETE (agora faz soft delete)
DROP POLICY IF EXISTS "Usuários podem deletar eleitores se tiverem permissão" ON public.eleitores;
CREATE POLICY "Usuários podem deletar eleitores se tiverem permissão"
ON public.eleitores FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_eleitores'::permission_type)
);

-- Demandas - SELECT
DROP POLICY IF EXISTS "Usuários podem ver demandas se tiverem permissão" ON public.demandas;
CREATE POLICY "Usuários podem ver demandas se tiverem permissão"
ON public.demandas FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_demandas'::permission_type)
  AND deleted_at IS NULL
);

-- Demandas - DELETE
DROP POLICY IF EXISTS "Usuários podem deletar demandas se tiverem permissão" ON public.demandas;
CREATE POLICY "Usuários podem deletar demandas se tiverem permissão"
ON public.demandas FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_demandas'::permission_type)
);

-- Agenda - SELECT
DROP POLICY IF EXISTS "Usuários podem ver agenda se tiverem permissão" ON public.agenda;
CREATE POLICY "Usuários podem ver agenda se tiverem permissão"
ON public.agenda FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_agenda'::permission_type)
  AND deleted_at IS NULL
);

-- Agenda - DELETE
DROP POLICY IF EXISTS "Usuários podem deletar eventos se tiverem permissão" ON public.agenda;
CREATE POLICY "Usuários podem deletar eventos se tiverem permissão"
ON public.agenda FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_agenda'::permission_type)
);

-- Roteiros - SELECT
DROP POLICY IF EXISTS "Usuários podem ver roteiros se tiverem permissão" ON public.roteiros;
CREATE POLICY "Usuários podem ver roteiros se tiverem permissão"
ON public.roteiros FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'view_roteiros'::permission_type)
  AND deleted_at IS NULL
);

-- Roteiros - DELETE
DROP POLICY IF EXISTS "Usuários podem deletar roteiros se tiverem permissão" ON public.roteiros;
CREATE POLICY "Usuários podem deletar roteiros se tiverem permissão"
ON public.roteiros FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_has_permission(gabinete_id, 'delete_roteiros'::permission_type)
);

-- Tags - SELECT
DROP POLICY IF EXISTS "Usuários podem ver tags dos seus gabinetes" ON public.tags;
CREATE POLICY "Usuários podem ver tags dos seus gabinetes"
ON public.tags FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NULL
);

-- Tags - DELETE
DROP POLICY IF EXISTS "Usuários podem deletar tags dos seus gabinetes" ON public.tags;
CREATE POLICY "Usuários podem deletar tags dos seus gabinetes"
ON public.tags FOR UPDATE
USING (user_has_gabinete_access(gabinete_id));

-- Política especial para auditoria ver registros deletados
DROP POLICY IF EXISTS "Auditoria pode ver eleitores deletados" ON public.eleitores;
CREATE POLICY "Auditoria pode ver eleitores deletados"
ON public.eleitores FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NOT NULL
);

DROP POLICY IF EXISTS "Auditoria pode ver demandas deletadas" ON public.demandas;
CREATE POLICY "Auditoria pode ver demandas deletadas"
ON public.demandas FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NOT NULL
);

DROP POLICY IF EXISTS "Auditoria pode ver agenda deletada" ON public.agenda;
CREATE POLICY "Auditoria pode ver agenda deletada"
ON public.agenda FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NOT NULL
);

DROP POLICY IF EXISTS "Auditoria pode ver roteiros deletados" ON public.roteiros;
CREATE POLICY "Auditoria pode ver roteiros deletados"
ON public.roteiros FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NOT NULL
);

DROP POLICY IF EXISTS "Auditoria pode ver tags deletadas" ON public.tags;
CREATE POLICY "Auditoria pode ver tags deletadas"
ON public.tags FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
  AND deleted_at IS NOT NULL
);