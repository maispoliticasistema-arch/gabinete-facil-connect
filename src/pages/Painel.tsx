import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewSection } from '@/components/painel/OverviewSection';
import { GabinetesSection } from '@/components/painel/GabinetesSection';
import { UsuariosSection } from '@/components/painel/UsuariosSection';
import { DesempenhoSection } from '@/components/painel/DesempenhoSection';
import { AuditoriaGlobalSection } from '@/components/painel/AuditoriaGlobalSection';
import { Shield } from 'lucide-react';

export default function Painel() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel do Sistema</h1>
            <p className="text-muted-foreground">
              Comando central do Gabinete Fácil
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="gabinetes">Gabinetes</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria Global</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewSection />
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
    </MainLayout>
  );
}
