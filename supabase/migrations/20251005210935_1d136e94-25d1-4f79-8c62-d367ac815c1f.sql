-- Adicionar coluna de código de indicação aos profiles
ALTER TABLE public.profiles 
ADD COLUMN codigo_indicacao TEXT UNIQUE;

-- Criar índice para otimizar buscas por código
CREATE INDEX idx_profiles_codigo_indicacao ON public.profiles(codigo_indicacao);

-- Função para gerar código único de indicação
CREATE OR REPLACE FUNCTION public.generate_codigo_indicacao()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gera código aleatório de 8 caracteres
    codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE codigo_indicacao = codigo) INTO existe;
    
    -- Se não existe, retorna o código
    IF NOT existe THEN
      RETURN codigo;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para gerar código automaticamente ao criar profile
CREATE OR REPLACE FUNCTION public.set_codigo_indicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_indicacao IS NULL THEN
    NEW.codigo_indicacao := generate_codigo_indicacao();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_codigo_indicacao
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_codigo_indicacao();

-- Gerar códigos para profiles existentes
UPDATE public.profiles 
SET codigo_indicacao = generate_codigo_indicacao()
WHERE codigo_indicacao IS NULL;