import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InfoGabinete } from "@/components/configuracoes/InfoGabinete";
import { UsuariosPermissoes } from "@/components/configuracoes/UsuariosPermissoes";
import { Integracoes } from "@/components/configuracoes/Integracoes";
import { Notificacoes } from "@/components/configuracoes/Notificacoes";
import { Seguranca } from "@/components/configuracoes/Seguranca";
import { useGabinete } from "@/contexts/GabineteContext";
import { usePermissions } from "@/hooks/usePermissions";
import { NoPermissionMessage } from "@/components/PermissionGuard";
import { Building2, Users, Plug, Bell, Shield } from "lucide-react";

export default function Configuracoes() {
  const { currentGabinete } = useGabinete();
  const { isAdmin } = usePermissions();

  if (!currentGabinete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Apenas admins e owners podem acessar configurações
  if (!isAdmin) {
    return <NoPermissionMessage />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações e preferências do gabinete
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Gabinete</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="p-6">
            <InfoGabinete gabinete={currentGabinete.gabinetes} />
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card className="p-6">
            <UsuariosPermissoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card className="p-6">
            <Integracoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="p-6">
            <Notificacoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card className="p-6">
            <Seguranca gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
