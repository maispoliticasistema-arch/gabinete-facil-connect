import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { isPermissionError, getPermissionErrorMessage } from '@/lib/permissionErrors';
import { logAudit } from '@/lib/auditLog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from 'lucide-react';

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

const eleitoresSchema = z.object({
  nome_completo: z.string().trim().min(1, 'Nome completo é obrigatório').max(200, 'Nome muito longo'),
  telefone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo').optional().or(z.literal('')),
  data_nascimento: z.string().regex(/^(\d{2}\/\d{2}\/\d{4})?$/, 'Formato deve ser DD/MM/AAAA').optional(),
  endereco: z.string().trim().max(300, 'Endereço muito longo').optional(),
  numero: z.string().trim().max(20, 'Número muito longo').optional(),
  bairro: z.string().trim().max(100, 'Bairro muito longo').optional(),
  cidade: z.string().trim().max(100, 'Cidade muito longa').optional(),
  estado: z.string().trim().max(2, 'Estado deve ter 2 caracteres').optional(),
  cep: z.string().trim().max(9, 'CEP muito longo').optional(),
});

type EleitoresFormData = z.infer<typeof eleitoresSchema>;

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

interface EditEleitoresDialogProps {
  eleitor: Eleitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEleitoresUpdated: () => void;
}

export const EditEleitoresDialog = ({
  eleitor,
  open,
  onOpenChange,
  onEleitoresUpdated,
}: EditEleitoresDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const { currentGabinete } = useGabinete();

  const form = useForm<EleitoresFormData>({
    resolver: zodResolver(eleitoresSchema),
    defaultValues: {
      nome_completo: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  useEffect(() => {
    if (open && currentGabinete) {
      fetchTags();
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

  const fetchEleitoresTags = async (eleitoresId: string) => {
    try {
      const { data, error } = await supabase
        .from('eleitor_tags')
        .select('tag_id')
        .eq('eleitor_id', eleitoresId);

      if (error) throw error;
      setSelectedTags((data || []).map((t) => t.tag_id));
    } catch (error: any) {
      console.error('Erro ao carregar tags do eleitor:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  useEffect(() => {
    if (eleitor) {
      // Convert YYYY-MM-DD to DD/MM/AAAA
      let dataNascimento = '';
      if (eleitor.data_nascimento) {
        const [ano, mes, dia] = eleitor.data_nascimento.split('-');
        if (ano && mes && dia) {
          dataNascimento = `${dia}/${mes}/${ano}`;
        }
      }

      form.reset({
        nome_completo: eleitor.nome_completo,
        telefone: eleitor.telefone || '',
        email: eleitor.email || '',
        data_nascimento: dataNascimento,
        endereco: eleitor.endereco || '',
        numero: eleitor.numero || '',
        bairro: eleitor.bairro || '',
        cidade: eleitor.cidade || '',
        estado: eleitor.estado || '',
        cep: eleitor.cep || '',
      });

      // Buscar tags do eleitor
      fetchEleitoresTags(eleitor.id);
    }
  }, [eleitor, form]);

  const onSubmit = async (data: EleitoresFormData) => {
    if (!eleitor) return;

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

      const { error } = await supabase
        .from('eleitores')
        .update({
          nome_completo: data.nome_completo,
          telefone: data.telefone || null,
          email: data.email || null,
          data_nascimento: dataNascimento,
          endereco: data.endereco || null,
          numero: data.numero || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          cep: data.cep || null,
        })
        .eq('id', eleitor.id);

      if (error) {
        // Verificar se é erro de permissão (RLS)
        if (isPermissionError(error)) {
          const errorMsg = getPermissionErrorMessage('edit');
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

      // Atualizar tags
      // Primeiro deletar as tags antigas
      await supabase.from('eleitor_tags').delete().eq('eleitor_id', eleitor.id);

      // Depois adicionar as novas tags
      if (selectedTags.length > 0) {
        const tagRelations = selectedTags.map((tagId) => ({
          eleitor_id: eleitor.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('eleitor_tags')
          .insert(tagRelations);

        if (tagError) throw tagError;
      }

      // Tentar geocodificar automaticamente se o endereço mudou
      if (data.endereco || data.cep) {
        try {
          const { data: updatedEleitor } = await supabase
            .from('eleitores')
            .select('*')
            .eq('id', eleitor.id)
            .single();

          if (updatedEleitor) {
            await supabase.functions.invoke('geocode', {
              body: { eleitores: [updatedEleitor] }
            });
          }
        } catch (geocodeError) {
          console.error('Geocode error:', geocodeError);
          // Não bloquear a atualização se a geocodificação falhar
        }
      }

      // Registrar log de auditoria
      if (currentGabinete) {
        await logAudit({
          gabineteId: currentGabinete.gabinete_id,
          action: 'update',
          entityType: 'eleitor',
          entityId: eleitor.id,
          details: { nome: data.nome_completo }
        });
      }

      toast({
        title: 'Eleitor atualizado!',
        description: 'As informações foram atualizadas com sucesso.',
      });

      onOpenChange(false);
      onEleitoresUpdated();
    } catch (error: any) {
      // Verificar se é erro de permissão
      if (isPermissionError(error)) {
        const errorMsg = getPermissionErrorMessage('edit');
        toast({
          title: errorMsg.title,
          description: errorMsg.description,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao atualizar eleitor',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Eleitor</DialogTitle>
          <DialogDescription>
            Atualize os dados do eleitor
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
                      <Input
                        placeholder="DD/MM/AAAA"
                        value={field.value || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 8) value = value.slice(0, 8);
                          if (value.length >= 5) {
                            value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
                          } else if (value.length >= 3) {
                            value = `${value.slice(0, 2)}/${value.slice(2)}`;
                          }
                          field.onChange(value);
                        }}
                        maxLength={10}
                      />
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
