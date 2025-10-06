-- Adicionar novos valores ao enum audit_action
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'export_report';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'import_data';

-- Adicionar novos valores ao enum audit_entity
ALTER TYPE audit_entity ADD VALUE IF NOT EXISTS 'relatorio';