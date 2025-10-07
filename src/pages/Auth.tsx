import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Building2, Lock, Mail, User } from 'lucide-react';
import { logAuthAttempt } from '@/lib/authLogger';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [codigoGabinete, setCodigoGabinete] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Registrar tentativa falhada
      await logAuthAttempt({
        email,
        success: false,
        errorMessage: error.message,
      });

      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Registrar tentativa bem-sucedida
      await logAuthAttempt({
        email,
        success: true,
        userId: data.user?.id,
      });

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup-gabinete`,
          data: {
            nome_completo: nomeCompleto,
          },
        },
      });

      if (error) throw error;

      // Se informou código do gabinete, criar solicitação de acesso
      if (codigoGabinete.trim()) {
        // Buscar gabinete pelo código
        const { data: gabineteData, error: gabineteError } = await supabase
          .from('gabinetes')
          .select('id, nome')
          .eq('codigo_convite', codigoGabinete.toUpperCase())
          .single();

        if (gabineteError || !gabineteData) {
          toast({
            title: 'Código inválido',
            description: 'O código do gabinete não foi encontrado.',
            variant: 'destructive',
          });
        } else if (data?.user) {
          // Criar solicitação de acesso
          const { error: requestError } = await supabase
            .from('gabinete_access_requests')
            .insert({
              gabinete_id: gabineteData.id,
              user_id: data.user.id,
              status: 'pendente',
              mensagem: `Solicitação de acesso ao gabinete ${gabineteData.nome}`,
            });

          if (requestError) {
            console.error('Erro ao criar solicitação:', requestError);
          } else {
            toast({
              title: 'Conta criada com sucesso!',
              description: 'Sua solicitação de acesso ao gabinete foi enviada.',
            });
          }
        }
      } else {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Redirecionando para configuração...',
        });
        // Redirecionar imediatamente para setup (funciona se email confirmation estiver desabilitado)
        if (data?.user) {
          navigate('/setup-gabinete');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-card-hover">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Gabinete Fácil</CardTitle>
          <CardDescription>
            Sistema completo de gestão para gabinetes políticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-login">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-login"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-signup">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo-gabinete">
                    Código do Gabinete <span className="text-xs text-muted-foreground">(Opcional)</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="codigo-gabinete"
                      type="text"
                      placeholder="Ex: ABC12345"
                      value={codigoGabinete}
                      onChange={(e) => setCodigoGabinete(e.target.value.toUpperCase())}
                      className="pl-10 font-mono"
                      maxLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se você tem um código de convite de um gabinete, insira-o aqui para solicitar acesso.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
