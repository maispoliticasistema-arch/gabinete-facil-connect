import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';

interface TagType {
  id: string;
  nome: string;
  cor: string;
}

export const TagsDialog = () => {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();

  const fetchTags = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('nome');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar tags',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, currentGabinete]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGabinete || !newTagName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('tags').insert({
        gabinete_id: currentGabinete.gabinete_id,
        nome: newTagName.trim(),
        cor: newTagColor,
      });

      if (error) throw error;

      toast({
        title: 'Tag criada!',
        description: 'A tag foi criada com sucesso.',
      });

      setNewTagName('');
      setNewTagColor('#6366f1');
      fetchTags();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar tag',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      // Delete tag relationships first
      await supabase.from('eleitor_tags').delete().eq('tag_id', tagId);

      // Then delete the tag
      const { error } = await supabase.from('tags').delete().eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Tag excluída!',
        description: 'A tag foi removida com sucesso.',
      });

      fetchTags();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir tag',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Tag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
          <DialogDescription>
            Crie e gerencie tags para organizar seus eleitores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="tag-name">Nome da Tag</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: VIP, Liderança, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="tag-color">Cor</Label>
                <Input
                  id="tag-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-20 h-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Tag
            </Button>
          </form>

          <div className="space-y-3">
            <Label>Tags Existentes</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma tag criada ainda
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.cor }}
                    className="pl-3 pr-2 py-1.5 text-white"
                  >
                    {tag.nome}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2 p-0 hover:bg-transparent"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};