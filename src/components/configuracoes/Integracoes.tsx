import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, FileSpreadsheet, Key } from "lucide-react";

interface IntegracoesProps {
  gabineteId: string;
}

const INTEGRATIONS = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincronizar compromissos da agenda",
    icon: Calendar,
  },
  {
    id: "export_xlsx",
    name: "Exportação XLSX/CSV",
    description: "Exportar listas de eleitores e demandas",
    icon: FileSpreadsheet,
  },
  {
    id: "api_keys",
    name: "Chaves de API",
    description: "Integração com relatórios automatizados",
    icon: Key,
  },
];

export function Integracoes({ gabineteId }: IntegracoesProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("gabinete_integrations")
        .select("*")
        .eq("gabinete_id", gabineteId);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Erro ao buscar integrações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [gabineteId]);

  const toggleIntegration = async (integrationType: string, currentStatus: boolean) => {
    try {
      const existing = integrations.find(i => i.integration_type === integrationType);

      if (existing) {
        const { error } = await supabase
          .from("gabinete_integrations")
          .update({ is_active: !currentStatus })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("gabinete_integrations")
          .insert({
            gabinete_id: gabineteId,
            integration_type: integrationType,
            is_active: true,
          });

        if (error) throw error;
      }

      toast.success(currentStatus ? "Integração desativada" : "Integração ativada");
      fetchIntegrations();
    } catch (error) {
      console.error("Erro ao atualizar integração:", error);
      toast.error("Erro ao atualizar integração");
    }
  };

  const getIntegrationStatus = (integrationType: string) => {
    const integration = integrations.find(i => i.integration_type === integrationType);
    return integration?.is_active || false;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Integrações</h2>
        <p className="text-muted-foreground mt-1">
          Conecte o sistema a ferramentas externas
        </p>
      </div>

      <div className="grid gap-4">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const isActive = getIntegrationStatus(integration.id);

          return (
            <Card key={integration.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleIntegration(integration.id, isActive)}
                      />
                      <Label className="text-sm">
                        {isActive ? "Conectado" : "Desconectado"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
