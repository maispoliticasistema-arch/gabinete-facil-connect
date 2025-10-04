-- Remover política atual de SELECT
DROP POLICY IF EXISTS "Usuários podem ver membros dos seus gabinetes" ON public.user_gabinetes;

-- Criar nova política de SELECT sem recursão
-- A ideia é permitir que qualquer usuário autenticado veja os membros dos gabinetes
-- desde que tenha um vínculo ativo com esse gabinete
-- Usamos uma subconsulta direta que o Postgres pode otimizar
CREATE POLICY "Usuários podem ver membros dos seus gabinetes"
ON public.user_gabinetes
FOR SELECT
USING (
  -- Permitir ver todos os membros de gabinetes onde o usuário atual está ativo
  gabinete_id IN (
    SELECT ug.gabinete_id 
    FROM public.user_gabinetes ug
    WHERE ug.user_id = auth.uid()
    AND ug.ativo = true
  )
);