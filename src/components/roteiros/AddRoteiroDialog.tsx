import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roteiroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data: z.string().min(1, 'Data é obrigatória'),
  hora_inicio: z.string().optional(),
  objetivo: z.string().optional()
});

type RoteiroFormData = z.infer<typeof roteiroSchema>;

interface Eleitor {
  id: string;
  nome_completo: string;
  endereco: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AddRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoteiroAdded: () => void;
}

export const AddRoteiroDialog = ({
  open,
  onOpenChange,
  onRoteiroAdded
}: AddRoteiroDialogProps) => {
  const { currentGabinete } = useGabinete();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [selectedEleitores, setSelectedEleitores] = useState<Eleitor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<RoteiroFormData>({
    resolver: zodResolver(roteiroSchema),
    defaultValues: {
      nome: '',
      data: new Date().toISOString().split('T')[0],
      hora_inicio: '',
      objetivo: ''
    }
  });

  useEffect(() => {
    if (open && currentGabinete) {
      fetchEleitores();
    }
  }, [open, currentGabinete]);

  const fetchEleitores = async () => {
    if (!currentGabinete) return;

    const { data, error } = await supabase
      .from('eleitores')
      .select('id, nome_completo, endereco, bairro, latitude, longitude')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('nome_completo');

    if (error) {
      console.error('Erro ao buscar eleitores:', error);
      return;
    }

    setEleitores(data || []);
  };

  const toggleEleitor = (eleitor: Eleitor) => {
    setSelectedEleitores(prev => {
      const exists = prev.find(e => e.id === eleitor.id);
      if (exists) {
        return prev.filter(e => e.id !== eleitor.id);
      }
      return [...prev, eleitor];
    });
  };

  const filteredEleitores = eleitores.filter(e =>
    e.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.endereco && e.endereco.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onSubmit = async (data: RoteiroFormData) => {
    if (!currentGabinete || !user) {
      toast({
        title: 'Erro',
        description: 'Usuário ou gabinete não identificado',
        variant: 'destructive'
      });
      return;
    }

    if (selectedEleitores.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos um local ao roteiro',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: roteiro, error: roteiroError } = await supabase
        .from('roteiros')
        .insert({
          gabinete_id: currentGabinete.gabinete_id,
          nome: data.nome,
          data: data.data,
          hora_inicio: data.hora_inicio || null,
          objetivo: data.objetivo || null,
          criado_por: user.id,
          status: 'planejado'
        })
        .select()
        .single();

      if (roteiroError) throw roteiroError;

      const pontos = selectedEleitores.map((eleitor, index) => ({
        roteiro_id: roteiro.id,
        ordem: index + 1,
        eleitor_id: eleitor.id,
        latitude: eleitor.latitude,
        longitude: eleitor.longitude,
        observacoes: `${eleitor.endereco || ''}, ${eleitor.bairro || ''}`
      }));

      const { error: pontosError } = await supabase
        .from('roteiro_pontos')
        .insert(pontos);

      if (pontosError) throw pontosError;

      toast({
        title: 'Sucesso',
        description: 'Roteiro criado com sucesso!'
      });

      form.reset();
      setSelectedEleitores([]);
      setSearchTerm('');
      onOpenChange(false);
      onRoteiroAdded();
    } catch (error) {
      console.error('Erro ao criar roteiro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o roteiro',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Roteiro</DialogTitle>
          <DialogDescription>
            Planeje um roteiro de visitas com os locais em sequência
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Roteiro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Visitas Bairro Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo / Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Revisar demandas de iluminação pública"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Locais do Roteiro ({selectedEleitores.length})</FormLabel>
              
              {selectedEleitores.length > 0 && (
                <div className="space-y-1 mb-2">
                  {selectedEleitores.map((eleitor, index) => (
                    <div
                      key={eleitor.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                    >
                      <span>
                        {index + 1}. {eleitor.nome_completo}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEleitor(eleitor)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Input
                placeholder="Buscar eleitor por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                {filteredEleitores.slice(0, 20).map(eleitor => {
                  const isSelected = selectedEleitores.find(e => e.id === eleitor.id);
                  return (
                    <button
                      key={eleitor.id}
                      type="button"
                      onClick={() => toggleEleitor(eleitor)}
                      className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{eleitor.nome_completo}</div>
                      <div className="text-xs opacity-75">
                        {eleitor.endereco || 'Sem endereço'} - {eleitor.bairro || ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Roteiro
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};