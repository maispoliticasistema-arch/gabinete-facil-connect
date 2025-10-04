-- Criar enum para cargos políticos
CREATE TYPE public.cargo_politico AS ENUM (
  'vereador',
  'prefeito',
  'deputado_estadual',
  'deputado_federal',
  'senador'
);

-- Adicionar campo cargo na tabela gabinetes
ALTER TABLE public.gabinetes
ADD COLUMN cargo cargo_politico;

-- Criar política para permitir usuários criarem seus gabinetes
CREATE POLICY "Usuários podem criar seus próprios gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar política para permitir criadores vincularem-se aos gabinetes
CREATE POLICY "Usuários podem vincular-se aos gabinetes que criaram"
ON public.user_gabinetes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());