import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Monitor, Smartphone } from "lucide-react";

export function SessionControl() {
  const { session } = useAuth();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sessões ativas vinculadas à sua conta
      </p>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Sessão Atual</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {session?.user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta sessão está ativa agora
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Sessão Atual
          </Button>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 Apenas a sessão atual está sendo exibida. O controle completo de sessões será implementado em breve.
      </p>
    </div>
  );
}
