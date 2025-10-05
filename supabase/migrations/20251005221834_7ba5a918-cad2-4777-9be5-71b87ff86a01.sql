-- Adicionar campo site_path para permitir múltiplos sites por gabinete
ALTER TABLE public.portal_gabinete 
ADD COLUMN IF NOT EXISTS site_path text NOT NULL DEFAULT 'portal';

-- Remover constraint única do slug (se existir)
ALTER TABLE public.portal_gabinete 
DROP CONSTRAINT IF EXISTS portal_gabinete_slug_key;

-- Adicionar constraint única para gabinete_id + site_path
CREATE UNIQUE INDEX IF NOT EXISTS portal_gabinete_gabinete_site_unique 
ON public.portal_gabinete(gabinete_id, site_path);

-- Manter slug único apenas entre sites publicados  
CREATE UNIQUE INDEX IF NOT EXISTS portal_gabinete_slug_unique 
ON public.portal_gabinete(slug) 
WHERE publicado = true;

-- Criar função para gerar slug baseado no gabinete
CREATE OR REPLACE FUNCTION public.generate_gabinete_slug(gabinete_nome text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Remove acentos e caracteres especiais, converte para lowercase
  base_slug := lower(regexp_replace(
    unaccent(gabinete_nome),
    '[^a-z0-9]+', '-', 'g'
  ));
  
  -- Remove hífens do início e fim
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Verifica se já existe e adiciona número se necessário
  WHILE EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE lower(regexp_replace(unaccent(nome), '[^a-z0-9]+', '-', 'g')) = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;