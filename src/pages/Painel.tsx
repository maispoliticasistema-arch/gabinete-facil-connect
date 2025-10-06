import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OverviewSection } from '@/components/painel/OverviewSection';
import { GabinetesSection } from '@/components/painel/GabinetesSection';
import { UsuariosSection } from '@/components/painel/UsuariosSection';
import { DesempenhoSection } from '@/components/painel/DesempenhoSection';
import { AuditoriaGlobalSection } from '@/components/painel/AuditoriaGlobalSection';
import { ErrosSection } from '@/components/painel/ErrosSection';
import { MonitoramentoSection } from '@/components/painel/MonitoramentoSection';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Painel() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Painel do Sistema</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Comando Central do Gabinete Fácil</h2>
            <p className="text-muted-foreground">
              Monitoramento completo da plataforma
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="monitoramento">Monitoramento</TabsTrigger>
              <TabsTrigger value="erros">Erros</TabsTrigger>
              <TabsTrigger value="gabinetes">Gabinetes</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
              <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
              <TabsTrigger value="auditoria">Auditoria Global</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewSection />
            </TabsContent>

            <TabsContent value="monitoramento">
              <MonitoramentoSection />
            </TabsContent>

            <TabsContent value="erros">
              <ErrosSection />
            </TabsContent>

            <TabsContent value="gabinetes">
              <GabinetesSection />
            </TabsContent>

            <TabsContent value="usuarios">
              <UsuariosSection />
            </TabsContent>

            <TabsContent value="desempenho">
              <DesempenhoSection />
            </TabsContent>

            <TabsContent value="auditoria">
              <AuditoriaGlobalSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
