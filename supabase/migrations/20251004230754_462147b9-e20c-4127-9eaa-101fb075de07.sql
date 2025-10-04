-- Adicionar política para permitir que membros do mesmo gabinete vejam perfis uns dos outros
CREATE POLICY "Membros do gabinete podem ver perfis de outros membros"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes ug1
    INNER JOIN public.user_gabinetes ug2 ON ug1.gabinete_id = ug2.gabinete_id
    WHERE ug1.user_id = auth.uid()
      AND ug2.user_id = profiles.id
      AND ug1.ativo = true
      AND ug2.ativo = true
  )
);