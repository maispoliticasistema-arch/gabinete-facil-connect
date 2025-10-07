import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/auditLog';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

interface NivelEnvolvimento {
  id: string;
  nome: string;
  cor: string;
}

const eleitoresSchema = z.object({
  nome_completo: z.string().trim().min(1, 'Nome completo é obrigatório').max(200, 'Nome muito longo'),
  telefone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo').optional().or(z.literal('')),
  data_nascimento: z.string().regex(/^(\d{2}\/\d{2}\/\d{4})?$/, 'Formato deve ser DD/MM/AAAA').optional(),
  sexo: z.enum(['masculino', 'feminino', '']).optional(),
  endereco: z.string().trim().max(300, 'Endereço muito longo').optional(),
  numero: z.string().trim().max(20, 'Número muito longo').optional(),
  complemento: z.string().trim().max(100, 'Complemento muito longo').optional(),
  bairro: z.string().trim().max(100, 'Bairro muito longo').optional(),
  cidade: z.string().trim().max(100, 'Cidade muito longa').optional(),
  estado: z.string().trim().max(2, 'Estado deve ter 2 caracteres').optional(),
  cep: z.string().trim().max(9, 'CEP muito longo').optional(),
});

type EleitoresFormData = z.infer<typeof eleitoresSchema>;

interface AddEleitoresDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEleitoresAdded: () => void;
}

export const AddEleitoresDialog = ({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange, 
  onEleitoresAdded 
}: AddEleitoresDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [niveis, setNiveis] = useState<NivelEnvolvimento[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<string>('');
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
      sexo: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  useEffect(() => {
    if (open && currentGabinete) {
      fetchTags();
      fetchNiveis();
    }
  }, [open, currentGabinete]);

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
      console.error('Erro ao carregar tags:', error);
    }
  };

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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

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

      const { data: eleitorData, error } = await supabase
        .from('eleitores')
        .insert({
          nome_completo: data.nome_completo,
          telefone: data.telefone || null,
          email: data.email || null,
          data_nascimento: dataNascimento,
          sexo: data.sexo || null,
          endereco: data.endereco || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          cep: data.cep || null,
          gabinete_id: currentGabinete.gabinete_id,
          cadastrado_por: user.id,
          nivel_envolvimento_id: selectedNivel || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar tags se houver
      if (eleitorData && selectedTags.length > 0) {
        const tagRelations = selectedTags.map((tagId) => ({
          eleitor_id: eleitorData.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('eleitor_tags')
          .insert(tagRelations);

        if (tagError) throw tagError;
      }

      // Tentar geocodificar automaticamente
      if (eleitorData && (data.endereco || data.cep)) {
        try {
          await supabase.functions.invoke('geocode', {
            body: { eleitores: [eleitorData] }
          });
        } catch (geocodeError) {
          console.error('Geocode error:', geocodeError);
          // Não bloquear o cadastro se a geocodificação falhar
        }
      }

      // Registrar log de auditoria
      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'create',
        entityType: 'eleitor',
        entityId: eleitorData.id,
        details: { nome: data.nome_completo }
      });

      toast({
        title: 'Eleitor cadastrado!',
        description: 'O eleitor foi adicionado com sucesso.',
      });

      form.reset();
      setSelectedTags([]);
      setSelectedNivel('');
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Eleitor</DialogTitle>
          <DialogDescription>
            Preencha os dados do eleitor para adicionar ao seu gabinete
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                name="sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Av, etc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, bloco, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado (UF)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SP" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {tags.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className="cursor-pointer"
                      >
                        <Badge
                          style={{
                            backgroundColor: tag.cor,
                            color: '#fff',
                          }}
                        >
                          {tag.nome}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {niveis.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Nível de Envolvimento</FormLabel>
                <Select value={selectedNivel || 'none'} onValueChange={(value) => setSelectedNivel(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
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
              </div>
            )}

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
