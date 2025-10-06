-- Criar função que valida se o slug está sendo usado por outro gabinete
CREATE OR REPLACE FUNCTION validate_portal_slug()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para validar antes de inserir
DROP TRIGGER IF EXISTS validate_portal_slug_before_insert ON portal_gabinete;
CREATE TRIGGER validate_portal_slug_before_insert
  BEFORE INSERT ON portal_gabinete
  FOR EACH ROW
  EXECUTE FUNCTION validate_portal_slug();

-- Criar trigger para validar antes de atualizar
DROP TRIGGER IF EXISTS validate_portal_slug_before_update ON portal_gabinete;
CREATE TRIGGER validate_portal_slug_before_update
  BEFORE UPDATE ON portal_gabinete
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION validate_portal_slug();