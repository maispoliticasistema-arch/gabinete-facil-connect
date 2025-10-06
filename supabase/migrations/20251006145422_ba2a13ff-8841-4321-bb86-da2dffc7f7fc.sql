-- Corrigir search_path da função de validação de slug
CREATE OR REPLACE FUNCTION validate_portal_slug()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Verificar se existe algum registro com o mesmo slug mas gabinete diferente
  IF EXISTS (
    SELECT 1 
    FROM portal_gabinete 
    WHERE slug = NEW.slug 
      AND gabinete_id != NEW.gabinete_id
  ) THEN
    RAISE EXCEPTION 'Este slug já está sendo usado por outro gabinete';
  END IF;
  
  RETURN NEW;
END;
$$;