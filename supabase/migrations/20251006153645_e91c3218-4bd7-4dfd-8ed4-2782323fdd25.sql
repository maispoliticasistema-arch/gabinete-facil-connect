-- Permitir que superowners vejam todos os perfis do sistema
CREATE POLICY "Superowners podem ver todos os perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'));

-- Permitir que superowners vejam todos os user_gabinetes
CREATE POLICY "Superowners podem ver todos os user_gabinetes"
ON public.user_gabinetes
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'));

-- Permitir que superowners vejam todos os gabinetes
CREATE POLICY "Superowners podem ver todos os gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'));