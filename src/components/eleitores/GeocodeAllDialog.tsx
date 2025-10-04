import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Loader2 } from 'lucide-react';

interface GeocodeAllDialogProps {
  onComplete: () => void;
}

export function GeocodeAllDialog({ onComplete }: GeocodeAllDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ success: number; total: number } | null>(null);
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

  const handleGeocode = async () => {
    if (!currentGabinete) return;

    setLoading(true);
    setProgress(0);
    setStats(null);

    try {
      // Buscar eleitores sem coordenadas
      const { data: eleitores, error } = await supabase
        .from('eleitores')
        .select('id, endereco, numero, bairro, cidade, estado, cep')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .or('latitude.is.null,longitude.is.null');

      if (error) throw error;

      if (!eleitores || eleitores.length === 0) {
        toast({
          title: 'Nenhum eleitor encontrado',
          description: 'Todos os eleitores já possuem coordenadas.',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Iniciando geocodificação',
        description: `Processando ${eleitores.length} eleitores...`,
      });

      // Processar em lotes menores para feedback mais rápido
      const batchSize = 20;
      let totalSuccess = 0;

      for (let i = 0; i < eleitores.length; i += batchSize) {
        const batch = eleitores.slice(i, i + batchSize);
        
        const { data, error: geocodeError } = await supabase.functions.invoke('geocode', {
          body: { eleitores: batch }
        });

        if (geocodeError) {
          console.error('Geocode error:', geocodeError);
        } else if (data) {
          totalSuccess += data.successCount || 0;
        }

        setProgress(Math.round(((i + batch.length) / eleitores.length) * 100));
      }

      setStats({ success: totalSuccess, total: eleitores.length });
      
      toast({
        title: 'Geocodificação concluída!',
        description: `${totalSuccess} de ${eleitores.length} eleitores geocodificados com sucesso.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Erro ao geocodificar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MapPin className="mr-2 h-4 w-4" />
          Geocodificar Todos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Geocodificar Todos os Eleitores</DialogTitle>
          <DialogDescription>
            Esta ação irá buscar as coordenadas geográficas (latitude e longitude) de todos os eleitores que ainda não possuem essa informação, baseado nos seus endereços cadastrados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processando... {progress}%
              </p>
            </div>
          )}

          {stats && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">Resultado:</p>
              <p className="text-sm">
                {stats.success} de {stats.total} eleitores geocodificados com sucesso
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleGeocode} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Iniciar Geocodificação'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}