import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';

interface NivelEnvolvimento {
  id: string;
  nome: string;
  cor: string;
}

interface EleitoresNivelSelectProps {
  eleitorId: string;
  currentNivelId?: string | null;
  onNivelChange?: () => void;
}

export const EleitoresNivelSelect = ({ eleitorId, currentNivelId, onNivelChange }: EleitoresNivelSelectProps) => {
  const [niveis, setNiveis] = useState<NivelEnvolvimento[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<string | undefined>(currentNivelId || undefined);
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

  useEffect(() => {
    if (currentGabinete) {
      fetchNiveis();
    }
  }, [currentGabinete]);

  useEffect(() => {
    setSelectedNivel(currentNivelId || undefined);
  }, [currentNivelId]);

  const fetchNiveis = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('niveis_envolvimento')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .is('deleted_at', null)
        .order('ordem');

      if (error) throw error;
      setNiveis(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar níveis:', error);
    }
  };

  const handleNivelChange = async (nivelId: string) => {
    try {
      const { error } = await supabase
        .from('eleitores')
        .update({ nivel_envolvimento_id: nivelId === 'none' ? null : nivelId })
        .eq('id', eleitorId);

      if (error) throw error;

      setSelectedNivel(nivelId === 'none' ? undefined : nivelId);
      
      toast({
        title: 'Nível atualizado!',
        description: 'O nível de envolvimento foi atualizado com sucesso.',
      });

      if (onNivelChange) {
        onNivelChange();
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar nível',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const currentNivel = niveis.find(n => n.id === selectedNivel);

  return (
    <Select value={selectedNivel || 'none'} onValueChange={handleNivelChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {currentNivel ? (
            <Badge
              style={{
                backgroundColor: currentNivel.cor,
                color: '#fff',
              }}
              className="font-medium"
            >
              {currentNivel.nome}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Sem nível</span>
        </SelectItem>
        {niveis.map((nivel) => (
          <SelectItem key={nivel.id} value={nivel.id}>
            <Badge
              style={{
                backgroundColor: nivel.cor,
                color: '#fff',
              }}
              className="font-medium"
            >
              {nivel.nome}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
