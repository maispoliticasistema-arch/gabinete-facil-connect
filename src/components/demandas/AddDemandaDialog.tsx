import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

interface Eleitor {
  id: string;
  nome_completo: string;
}

interface UserGabinete {
  user_id: string;
  role: string;
  profiles: {
    nome_completo: string;
  };
}

const demandaSchema = z.object({
  titulo: z.string().trim().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  descricao: z.string().trim().optional(),
  eleitor_id: z.string().uuid('Selecione um eleitor'),
  responsavel_id: z.string().uuid('Selecione um responsável'),
  status: z.enum(['aberta', 'em_andamento', 'concluida', 'cancelada']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  prazo: z.string().regex(/^(\d{2}\/\d{2}\/\d{4})?$/, 'Formato deve ser DD/MM/AAAA').optional(),
});

type DemandaFormData = z.infer<typeof demandaSchema>;

interface AddDemandaDialogProps {
  onDemandaAdded: () => void;
}

export const AddDemandaDialog = ({ onDemandaAdded }: AddDemandaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [assessores, setAssessores] = useState<UserGabinete[]>([]);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();
  const { user } = useAuth();

  const form = useForm<DemandaFormData>({
    resolver: zodResolver(demandaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      eleitor_id: '',
      responsavel_id: '',
      status: 'aberta',
      prioridade: 'media',
      prazo: '',
    },
  });

  useEffect(() => {
    if (open && currentGabinete) {
      fetchEleitores();
      fetchAssessores();
    }
  }, [open, currentGabinete]);

  const fetchEleitores = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('eleitores')
        .select('id, nome_completo')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('nome_completo');

      if (error) throw error;
      setEleitores(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar eleitores:', error);
    }
  };

  const fetchAssessores = async () => {
    if (!currentGabinete) return;

    try {
      const { data, error } = await supabase
        .from('user_gabinetes')
        .select('user_id, role, profiles(nome_completo)')
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .eq('ativo', true);

      if (error) throw error;
      setAssessores((data || []) as unknown as UserGabinete[]);
    } catch (error: any) {
      console.error('Erro ao carregar assessores:', error);
    }
  };

  const onSubmit = async (data: DemandaFormData) => {
    if (!currentGabinete || !user) return;

    setLoading(true);
    try {
      // Convert DD/MM/AAAA to YYYY-MM-DD
      let prazo = null;
      if (data.prazo && data.prazo.trim()) {
        const [dia, mes, ano] = data.prazo.split('/');
        if (dia && mes && ano) {
          prazo = `${ano}-${mes}-${dia}`;
        }
      }

      const { error } = await supabase.from('demandas').insert({
        titulo: data.titulo,
        descricao: data.descricao || null,
        eleitor_id: data.eleitor_id,
        responsavel_id: data.responsavel_id,
        status: data.status,
        prioridade: data.prioridade,
        prazo: prazo,
        gabinete_id: currentGabinete.gabinete_id,
        criado_por: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Demanda criada!',
        description: 'A demanda foi adicionada com sucesso.',
      });

      form.reset();
      setOpen(false);
      onDemandaAdded();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar demanda',
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
          <Plus className="mr-2 h-4 w-4" />
          Nova Demanda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
          <DialogDescription>
            Registre uma nova solicitação ou atendimento
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título / Assunto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Troca de lâmpada na Rua X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhamento do problema ou solicitação..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eleitor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eleitor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o eleitor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eleitores.map((eleitor) => (
                        <SelectItem key={eleitor.id} value={eleitor.id}>
                          {eleitor.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o assessor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assessores.map((assessor) => (
                        <SelectItem key={assessor.user_id} value={assessor.user_id}>
                          {assessor.profiles.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prazo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de Conclusão</FormLabel>
                  <FormControl>
                    <Input placeholder="DD/MM/AAAA" {...field} />
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
                  'Criar Demanda'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};