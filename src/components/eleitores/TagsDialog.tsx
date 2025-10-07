import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { Tag, Plus, Trash2 } from 'lucide-react';

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
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

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

  const handleCreateTag = async () => {
    if (!currentGabinete || !newTagName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('tags').insert({
        nome: newTagName.trim(),
        cor: newTagColor,
        gabinete_id: currentGabinete.gabinete_id,
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
      // Primeiro deletar as relações
      await supabase.from('eleitor_tags').delete().eq('tag_id', tagId);

      // Depois fazer soft delete da tag
      const { error } = await supabase.from('tags').update({ deleted_at: new Date().toISOString() }).eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Tag deletada!',
        description: 'A tag foi removida com sucesso.',
      });

      fetchTags();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar tag',
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
          <DialogDescription>
            Crie e gerencie tags para organizar seus eleitores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Criar nova tag */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-semibold">Nova Tag</h3>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <Label htmlFor="tag-name">Nome</Label>
                <Input
                  id="tag-name"
                  placeholder="Ex: Apoiador"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="tag-color" className="text-xs">Cor</Label>
                <div className="relative">
                  <Input
                    id="tag-color"
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-10 w-full p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleCreateTag} disabled={loading || !newTagName.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Tag
            </Button>
          </div>

          {/* Lista de tags */}
          <div className="space-y-3 pb-4">
            <h3 className="text-sm font-semibold">Tags Existentes</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tag criada ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Badge
                      style={{
                        backgroundColor: tag.cor,
                        color: '#fff',
                      }}
                      className="font-medium"
                    >
                      {tag.nome}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};