-- Corrigir avisos de segurança do linter

-- 1. Adicionar search_path às funções de máscara
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF cpf IS NULL OR LENGTH(cpf) < 11 THEN
    RETURN NULL;
  END IF;
  RETURN SUBSTRING(cpf FROM 1 FOR 3) || '.***.***-**';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_rg(rg TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF rg IS NULL OR LENGTH(rg) < 4 THEN
    RETURN NULL;
  END IF;
  RETURN SUBSTRING(rg FROM 1 FOR 2) || '.***.**-*';
END;
$$;