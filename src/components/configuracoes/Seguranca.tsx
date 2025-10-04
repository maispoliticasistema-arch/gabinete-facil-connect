import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogs } from "./AuditLogs";
import { SessionControl } from "./SessionControl";

interface SegurancaProps {
  gabineteId: string;
}

export function Seguranca({ gabineteId }: SegurancaProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Segurança e Auditoria</h2>
        <p className="text-muted-foreground mt-1">
          Rastreabilidade e controle total do gabinete
        </p>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Log de Ações</TabsTrigger>
          <TabsTrigger value="sessions">Controle de Sessões</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <AuditLogs gabineteId={gabineteId} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
