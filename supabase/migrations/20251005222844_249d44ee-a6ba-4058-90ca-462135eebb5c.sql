-- Habilitar extensão unaccent para remover acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Recriar a função com a extensão habilitada
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