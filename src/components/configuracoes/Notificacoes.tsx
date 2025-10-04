import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NotificacoesProps {
  gabineteId: string;
}

export function Notificacoes({ gabineteId }: NotificacoesProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    internal_notifications: true,
    deadline_reminders: true,
  });

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .eq("gabinete_id", gabineteId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_notifications: data.email_notifications,
          internal_notifications: data.internal_notifications,
          deadline_reminders: data.deadline_reminders,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar preferências:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user, gabineteId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({
          user_id: user.id,
          gabinete_id: gabineteId,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Notificações e Preferências</h2>
        <p className="text-muted-foreground mt-1">
          Configure como e quando receber alertas
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Alertas por E-mail</Label>
            <p className="text-sm text-muted-foreground">
              Receber notificações de novas demandas e eventos
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, email_notifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-0.5">
            <Label htmlFor="internal-notifications">Notificações Internas</Label>
            <p className="text-sm text-muted-foreground">
              Exibidas dentro do sistema (sino de alertas)
            </p>
          </div>
          <Switch
            id="internal-notifications"
            checked={preferences.internal_notifications}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, internal_notifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="space-y-0.5">
            <Label htmlFor="deadline-reminders">Lembretes de Prazos</Label>
            <p className="text-sm text-muted-foreground">
              Avisos sobre demandas próximas do prazo
            </p>
          </div>
          <Switch
            id="deadline-reminders"
            checked={preferences.deadline_reminders}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, deadline_reminders: checked })
            }
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Preferências
      </Button>
    </div>
  );
}
