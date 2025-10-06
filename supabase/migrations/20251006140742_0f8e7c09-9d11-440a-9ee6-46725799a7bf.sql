-- Adicionar novas permissões relacionadas a eleitores
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'import_eleitores';
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'export_eleitores';
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'manage_tags';