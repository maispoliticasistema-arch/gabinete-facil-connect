-- Adicionar chave estrangeira entre demanda_comentarios e profiles
ALTER TABLE demanda_comentarios
ADD CONSTRAINT demanda_comentarios_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id);