import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateSiteDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateSite: (sitePath: string, titulo: string) => Promise<void>;
}

export const CreateSiteDialog = ({ open, onClose, onCreateSite }: CreateSiteDialogProps) => {
  const [sitePath, setSitePath] = useState('');
  const [titulo, setTitulo] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!sitePath.trim() || !titulo.trim()) return;

    setCreating(true);
    try {
      await onCreateSite(sitePath, titulo);
      setSitePath('');
      setTitulo('');
      onClose();
    } catch (error) {
      console.error('Erro ao criar site:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSitePathChange = (value: string) => {
    // Apenas letras minúsculas, números e hífens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setSitePath(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Site</DialogTitle>
          <DialogDescription>
            Crie um novo site para o seu gabinete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Site *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Portal Oficial, Ouvidoria, Projetos"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_path">Caminho do Site *</Label>
            <div className="flex gap-2">
              <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                /seu-gabinete/
              </span>
              <Input
                id="site_path"
                value={sitePath}
                onChange={(e) => handleSitePathChange(e.target.value)}
                placeholder="portal"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use apenas letras minúsculas, números e hífens. Ex: portal, ouvidoria, projetos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!sitePath.trim() || !titulo.trim() || creating}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Site'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
