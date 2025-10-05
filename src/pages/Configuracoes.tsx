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
    <div className="container mx-auto py-4 sm:py-6 space-y-4 md:space-y-6 px-3 sm:px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Gerencie as configurações e preferências do gabinete
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="info" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">Gabinete</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
            <Plug className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden lg:inline truncate">Integrações</span>
            <span className="lg:hidden truncate">Integr.</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden lg:inline truncate">Notificações</span>
            <span className="lg:hidden truncate">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden lg:inline truncate">Segurança</span>
            <span className="lg:hidden truncate">Segur.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="p-3 sm:p-6">
            <InfoGabinete gabinete={currentGabinete.gabinetes} />
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card className="p-3 sm:p-6">
            <UsuariosPermissoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card className="p-3 sm:p-6">
            <Integracoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="p-3 sm:p-6">
            <Notificacoes gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card className="p-3 sm:p-6">
            <Seguranca gabineteId={currentGabinete.gabinete_id} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
