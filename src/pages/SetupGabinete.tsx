import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGabinete } from '@/contexts/GabineteContext';

const SetupGabinete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchGabinetes } = useGabinete();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomePolitico: '',
    cargo: '',
    cidade: '',
    estado: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Criar o gabinete
      const { data: gabinete, error: gabineteError } = await supabase
        .from('gabinetes')
        .insert([{
          nome: formData.nomePolitico,
          cargo: formData.cargo as 'vereador' | 'prefeito' | 'deputado_estadual' | 'deputado_federal' | 'senador',
          cidade: formData.cidade,
          estado: formData.estado,
        }])
        .select()
        .single();

      if (gabineteError) throw gabineteError;

      // Vincular o usuário ao gabinete como owner
      const { error: vinculoError } = await supabase
        .from('user_gabinetes')
        .insert({
          user_id: user.id,
          gabinete_id: gabinete.id,
          role: 'owner',
        });

      if (vinculoError) throw vinculoError;

      toast({
        title: 'Gabinete criado com sucesso!',
        description: 'Você será redirecionado para o sistema.',
      });

      // Atualizar o contexto e navegar
      await refetchGabinetes();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar gabinete',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-card-hover">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Configure seu Gabinete</CardTitle>
          <CardDescription>
            Preencha as informações para começar a usar o Gabinete Fácil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomePolitico">Nome do Político</Label>
              <Input
                id="nomePolitico"
                type="text"
                placeholder="Ex: João Silva"
                value={formData.nomePolitico}
                onChange={(e) => setFormData({ ...formData, nomePolitico: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                required
              >
                <SelectTrigger id="cargo">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vereador">Vereador</SelectItem>
                  <SelectItem value="prefeito">Prefeito</SelectItem>
                  <SelectItem value="deputado_estadual">Deputado Estadual</SelectItem>
                  <SelectItem value="deputado_federal">Deputado Federal</SelectItem>
                  <SelectItem value="senador">Senador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  type="text"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando gabinete...
                </>
              ) : (
                'Criar Gabinete'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupGabinete;
