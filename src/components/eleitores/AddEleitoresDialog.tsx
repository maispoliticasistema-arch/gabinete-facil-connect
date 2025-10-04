import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';

const eleitoresSchema = z.object({
  nome_completo: z.string().trim().min(1, 'Nome completo é obrigatório').max(200, 'Nome muito longo'),
  telefone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo').optional().or(z.literal('')),
  data_nascimento: z.string().regex(/^(\d{2}\/\d{2}\/\d{4})?$/, 'Formato deve ser DD/MM/AAAA').optional(),
  endereco: z.string().trim().max(300, 'Endereço muito longo').optional(),
});

type EleitoresFormData = z.infer<typeof eleitoresSchema>;

interface AddEleitoresDialogProps {
  onEleitoresAdded: () => void;
}

export const AddEleitoresDialog = ({ onEleitoresAdded }: AddEleitoresDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();
  const { user } = useAuth();

  const form = useForm<EleitoresFormData>({
    resolver: zodResolver(eleitoresSchema),
    defaultValues: {
      nome_completo: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      endereco: '',
    },
  });

  const onSubmit = async (data: EleitoresFormData) => {
    if (!currentGabinete || !user) return;

    setLoading(true);
    try {
      // Convert DD/MM/AAAA to YYYY-MM-DD
      let dataNascimento = null;
      if (data.data_nascimento && data.data_nascimento.trim()) {
        const [dia, mes, ano] = data.data_nascimento.split('/');
        if (dia && mes && ano) {
          dataNascimento = `${ano}-${mes}-${dia}`;
        }
      }

      const { error } = await supabase.from('eleitores').insert({
        nome_completo: data.nome_completo,
        telefone: data.telefone || null,
        email: data.email || null,
        data_nascimento: dataNascimento,
        endereco: data.endereco || null,
        gabinete_id: currentGabinete.gabinete_id,
        cadastrado_por: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Eleitor cadastrado!',
        description: 'O eleitor foi adicionado com sucesso.',
      });

      form.reset();
      setOpen(false);
      onEleitoresAdded();
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar eleitor',
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
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Eleitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Eleitor</DialogTitle>
          <DialogDescription>
            Preencha os dados do eleitor para adicionar ao seu gabinete
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input placeholder="DD/MM/AAAA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Cadastrar Eleitor'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
