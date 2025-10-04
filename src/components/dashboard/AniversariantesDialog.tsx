import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, MapPin, Cake } from 'lucide-react';

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface AniversariantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AniversariantesDialog = ({ open, onOpenChange }: AniversariantesDialogProps) => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [aniversariantes, setAniversariantes] = useState<Eleitor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentGabinete) return;

    const fetchAniversariantes = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const { data, error } = await supabase
          .from('eleitores')
          .select('*')
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .not('data_nascimento', 'is', null);

        if (error) throw error;

        // Filtrar aniversariantes do dia no cliente
        const filtered = data?.filter(eleitor => {
          if (!eleitor.data_nascimento) return false;
          const nascimento = new Date(eleitor.data_nascimento + 'T00:00:00');
          const nascMonth = String(nascimento.getMonth() + 1).padStart(2, '0');
          const nascDay = String(nascimento.getDate()).padStart(2, '0');
          return nascMonth === month && nascDay === day;
        }) || [];

        setAniversariantes(filtered);
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar aniversariantes',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAniversariantes();
  }, [open, currentGabinete, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Aniversariantes de Hoje
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : aniversariantes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum aniversariante hoje.
          </div>
        ) : (
          <div className="space-y-4">
            {aniversariantes.map((eleitor) => (
              <div
                key={eleitor.id}
                className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg">{eleitor.nome_completo}</h3>
                
                <div className="space-y-1 text-sm">
                  {eleitor.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{eleitor.telefone}</span>
                    </div>
                  )}
                  
                  {eleitor.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{eleitor.email}</span>
                    </div>
                  )}
                  
                  {(eleitor.endereco || eleitor.cidade) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[eleitor.endereco, eleitor.cidade, eleitor.estado]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {eleitor.data_nascimento && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Cake className="h-4 w-4" />
                      <span>
                        {new Date().getFullYear() - new Date(eleitor.data_nascimento).getFullYear()} anos
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
