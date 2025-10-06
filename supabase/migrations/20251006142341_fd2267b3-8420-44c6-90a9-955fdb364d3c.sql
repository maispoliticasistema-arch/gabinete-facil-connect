-- Remover a constraint única de gabinete_id e criar uma nova constraint composta
-- para permitir múltiplos sites por gabinete com diferentes site_path

ALTER TABLE portal_gabinete 
DROP CONSTRAINT IF EXISTS portal_gabinete_gabinete_id_key;

-- Criar constraint única composta para gabinete_id + site_path
-- Isso permite múltiplos sites por gabinete, mas cada site_path deve ser único dentro do gabinete
ALTER TABLE portal_gabinete
ADD CONSTRAINT portal_gabinete_gabinete_id_site_path_key 
UNIQUE (gabinete_id, site_path);