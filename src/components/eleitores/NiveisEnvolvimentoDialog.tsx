import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { Target, Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react';

interface NivelEnvolvimento {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

export const NiveisEnvolvimentoDialog = () => {
  const [open, setOpen] = useState(false);
  const [niveis, setNiveis] = useState<NivelEnvolvimento[]>([]);
  const [newNivelName, setNewNivelName] = useState('');
  const [newNivelColor, setNewNivelColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [editingNivelId, setEditingNivelId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

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
      toast({
        title: 'Erro ao carregar níveis',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchNiveis();
    }
  }, [open, currentGabinete]);

  const handleCreateNivel = async () => {
    if (!currentGabinete || !newNivelName.trim()) return;

    setLoading(true);
    try {
      const maxOrdem = niveis.length > 0 ? Math.max(...niveis.map(n => n.ordem)) : -1;
      
      const { error } = await supabase.from('niveis_envolvimento').insert({
        nome: newNivelName.trim(),
        cor: newNivelColor,
        gabinete_id: currentGabinete.gabinete_id,
        ordem: maxOrdem + 1,
      });

      if (error) throw error;

      toast({
        title: 'Nível criado!',
        description: 'O nível de envolvimento foi criado com sucesso.',
      });

      setNewNivelName('');
      setNewNivelColor('#6366f1');
      fetchNiveis();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar nível',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNivel = async (nivelId: string) => {
    try {
      const { error } = await supabase
        .from('niveis_envolvimento')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', nivelId);

      if (error) throw error;

      toast({
        title: 'Nível deletado!',
        description: 'O nível de envolvimento foi removido com sucesso.',
      });

      fetchNiveis();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar nível',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startEditing = (nivel: NivelEnvolvimento) => {
    setEditingNivelId(nivel.id);
    setEditingName(nivel.nome);
    setEditingColor(nivel.cor);
  };

  const cancelEditing = () => {
    setEditingNivelId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleUpdateNivel = async (nivelId: string) => {
    if (!editingName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('niveis_envolvimento')
        .update({
          nome: editingName.trim(),
          cor: editingColor,
        })
        .eq('id', nivelId);

      if (error) throw error;

      toast({
        title: 'Nível atualizado!',
        description: 'O nível de envolvimento foi atualizado com sucesso.',
      });

      setEditingNivelId(null);
      setEditingName('');
      setEditingColor('');
      fetchNiveis();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar nível',
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
        <Button variant="outline" size="icon">
          <Target className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Níveis de Envolvimento</DialogTitle>
          <DialogDescription>
            Crie e gerencie níveis de envolvimento para categorizar seus eleitores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Criar novo nível */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-semibold">Novo Nível</h3>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <Label htmlFor="nivel-name">Nome</Label>
                <Input
                  id="nivel-name"
                  placeholder="Ex: Apoiador Ativo"
                  value={newNivelName}
                  onChange={(e) => setNewNivelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNivel();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="nivel-color" className="text-xs">Cor</Label>
                <div className="relative">
                  <Input
                    id="nivel-color"
                    type="color"
                    value={newNivelColor}
                    onChange={(e) => setNewNivelColor(e.target.value)}
                    className="h-10 w-full p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleCreateNivel} disabled={loading || !newNivelName.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Nível
            </Button>
          </div>

          {/* Lista de níveis */}
          <div className="space-y-3 pb-4">
            <h3 className="text-sm font-semibold">Níveis Existentes</h3>
            {niveis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum nível criado ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {niveis.map((nivel) => (
                  <div
                    key={nivel.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    {editingNivelId === nivel.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          placeholder="Nome do nível"
                        />
                        <Input
                          type="color"
                          value={editingColor}
                          onChange={(e) => setEditingColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 shrink-0"
                          onClick={() => handleUpdateNivel(nivel.id)}
                          disabled={loading || !editingName.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={cancelEditing}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge
                          style={{
                            backgroundColor: nivel.cor,
                            color: '#fff',
                          }}
                          className="font-medium flex-1"
                        >
                          {nivel.nome}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => startEditing(nivel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => handleDeleteNivel(nivel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
