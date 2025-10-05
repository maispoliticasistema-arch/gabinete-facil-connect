import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Loader2, UserPlus } from 'lucide-react';

const eleitorSchema = z.object({
  nome_completo: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  telefone: z.string().trim().max(20, 'Telefone deve ter no máximo 20 caracteres').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres').optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  endereco: z.string().trim().max(200, 'Endereço deve ter no máximo 200 caracteres').optional().or(z.literal('')),
  bairro: z.string().trim().max(100, 'Bairro deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  cidade: z.string().trim().max(100, 'Cidade deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  estado: z.string().trim().max(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
  cep: z.string().trim().max(10, 'CEP deve ter no máximo 10 caracteres').optional().or(z.literal('')),
  observacoes: z.string().trim().max(500, 'Observações devem ter no máximo 500 caracteres').optional().or(z.literal('')),
});

const CadastroPublico = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [indicadorNome, setIndicadorNome] = useState('');
  const [indicadorId, setIndicadorId] = useState<string | null>(null);
  const [gabineteId, setGabineteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dados do formulário
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
  });

  const codigoRef = searchParams.get('ref');

  useEffect(() => {
    if (!codigoRef) {
      toast({
        title: 'Link inválido',
        description: 'Este link de cadastro não é válido.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    const verificarCodigo = async () => {
      setLoading(true);
      try {
        // Buscar o perfil do indicador
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, nome_completo')
          .eq('codigo_indicacao', codigoRef)
          .single();

        if (profileError || !profile) {
          toast({
            title: 'Link inválido',
            description: 'Este código de indicação não existe.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIndicadorNome(profile.nome_completo);
        setIndicadorId(profile.id);

        // Buscar o gabinete do indicador
        const { data: userGabinete, error: gabineteError } = await supabase
          .from('user_gabinetes')
          .select('gabinete_id')
          .eq('user_id', profile.id)
          .eq('ativo', true)
          .limit(1)
          .single();

        if (gabineteError || !userGabinete) {
          toast({
            title: 'Erro',
            description: 'Não foi possível identificar o gabinete do indicador.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setGabineteId(userGabinete.gabinete_id);
      } catch (error) {
        console.error('Erro ao verificar código:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível verificar o link de indicação.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    verificarCodigo();
  }, [codigoRef, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gabineteId || !indicadorId) return;

    // Validar dados
    try {
      eleitorSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            validationErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(validationErrors);
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('eleitores').insert({
        gabinete_id: gabineteId,
        cadastrado_por: indicadorId,
        via_link_indicacao: true,
        nome_completo: formData.nome_completo.trim(),
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim() || null,
        cep: formData.cep.trim() || null,
        observacoes: formData.observacoes.trim() || null,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Cadastro realizado!',
        description: 'Seus dados foram cadastrados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar cadastro:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível realizar o cadastro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Cadastro Realizado!</h2>
            <p className="text-muted-foreground">
              Seus dados foram cadastrados com sucesso através da indicação de{' '}
              <strong>{indicadorNome}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta página agora.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cadastro de Eleitor</h1>
            <p className="text-muted-foreground">
              Link de indicação de <strong>{indicadorNome}</strong>
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Seus Dados
            </CardTitle>
            <CardDescription>
              Preencha o formulário abaixo para realizar seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => handleChange('nome_completo', e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={100}
                  required
                />
                {errors.nome_completo && (
                  <p className="text-xs text-destructive">{errors.nome_completo}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={20}
                  />
                  {errors.telefone && (
                    <p className="text-xs text-destructive">{errors.telefone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    maxLength={255}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleChange('data_nascimento', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  placeholder="Rua, número, complemento"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    placeholder="Bairro"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    placeholder="Cidade"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  placeholder="00000-000"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais..."
                  maxLength={500}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Realizar Cadastro
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CadastroPublico;
