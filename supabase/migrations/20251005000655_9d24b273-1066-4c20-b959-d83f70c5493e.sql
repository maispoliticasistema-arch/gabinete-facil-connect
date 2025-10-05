-- Adicionar permissão view_mapa ao enum permission_type
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'view_mapa';