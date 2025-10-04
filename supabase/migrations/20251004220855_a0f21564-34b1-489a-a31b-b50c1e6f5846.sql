-- Adicionar foreign key de agenda_participantes.user_id para profiles.id
ALTER TABLE public.agenda_participantes
ADD CONSTRAINT fk_agenda_participantes_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;