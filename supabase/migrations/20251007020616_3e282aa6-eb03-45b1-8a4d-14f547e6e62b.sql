-- Adicionar vice_prefeito ao enum de cargo
ALTER TYPE cargo_politico ADD VALUE IF NOT EXISTS 'vice_prefeito';