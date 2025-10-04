import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isPermissionError, getPermissionErrorMessage } from '@/lib/permissionErrors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface Eleitor {
  id: string;
  nome_completo: string;
}

interface DeleteEleitoresDialogProps {
  eleitor: Eleitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEleitoresDeleted: () => void;
}

export const DeleteEleitoresDialog = ({
  eleitor,
  open,
  onOpenChange,
  onEleitoresDeleted,
}: DeleteEleitoresDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!eleitor) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('eleitores')
        .delete()
        .eq('id', eleitor.id);

      if (error) {
        // Verificar se é erro de permissão (RLS)
        if (isPermissionError(error)) {
          const errorMsg = getPermissionErrorMessage('delete');
          toast({
            title: errorMsg.title,
            description: errorMsg.description,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        throw error;
      }

      toast({
        title: 'Eleitor excluído!',
        description: 'O eleitor foi removido com sucesso.',
      });

      onOpenChange(false);
      onEleitoresDeleted();
    } catch (error: any) {
      // Verificar se é erro de permissão
      if (isPermissionError(error)) {
        const errorMsg = getPermissionErrorMessage('delete');
        toast({
          title: errorMsg.title,
          description: errorMsg.description,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao excluir eleitor',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o eleitor{' '}
            <span className="font-semibold">{eleitor?.nome_completo}</span>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
