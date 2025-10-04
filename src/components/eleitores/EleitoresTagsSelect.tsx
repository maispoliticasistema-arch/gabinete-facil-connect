import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

interface EleitoresTagsSelectProps {
  eleitorId: string;
  onTagsChange?: () => void;
}

export const EleitoresTagsSelect = ({
  eleitorId,
  onTagsChange,
}: EleitoresTagsSelectProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();

  useEffect(() => {
    fetchTags();
    fetchEleitoresTags();
  }, [eleitorId, currentGabinete]);

  const fetchTags = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('nome');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar tags',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchEleitoresTags = async () => {
    try {
      const { data, error } = await supabase
        .from('eleitor_tags')
        .select('tag_id')
        .eq('eleitor_id', eleitorId);

      if (error) throw error;
      setSelectedTags(data?.map((et) => et.tag_id) || []);
    } catch (error: any) {
      console.error('Error fetching elector tags:', error);
    }
  };

  const toggleTag = async (tagId: string) => {
    setLoading(true);
    try {
      if (selectedTags.includes(tagId)) {
        // Remove tag
        const { error } = await supabase
          .from('eleitor_tags')
          .delete()
          .eq('eleitor_id', eleitorId)
          .eq('tag_id', tagId);

        if (error) throw error;
        setSelectedTags(selectedTags.filter((id) => id !== tagId));
      } else {
        // Add tag
        const { error } = await supabase
          .from('eleitor_tags')
          .insert({ eleitor_id: eleitorId, tag_id: tagId });

        if (error) throw error;
        setSelectedTags([...selectedTags, tagId]);
      }

      onTagsChange?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar tags',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTagsData = availableTags.filter((tag) =>
    selectedTags.includes(tag.id)
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {selectedTagsData.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.cor }}
          className="text-white text-xs px-2 py-0.5"
        >
          {tag.nome}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Nenhuma tag criada
              </p>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors"
                >
                  <Badge
                    style={{ backgroundColor: tag.cor }}
                    className="text-white text-xs"
                  >
                    {tag.nome}
                  </Badge>
                  {selectedTags.includes(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};