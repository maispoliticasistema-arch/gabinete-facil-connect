import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gabineteId: string;
  onSuccess: () => void;
  editingTemplate?: {
    id: string;
    nome: string;
    descricao: string | null;
    permission_template_permissions: { permission: string }[];
  } | null;
}

const PERMISSIONS = [
  { id: "view_eleitores", label: "Visualizar Eleitores" },
  { id: "create_eleitores", label: "Criar Eleitores" },
  { id: "edit_eleitores", label: "Editar Eleitores" },
  { id: "delete_eleitores", label: "Excluir Eleitores" },
  { id: "import_eleitores", label: "Importar Eleitores" },
  { id: "export_eleitores", label: "Exportar Dados" },
  { id: "manage_tags", label: "Gerenciar Tags/Etiquetas" },
  { id: "view_demandas", label: "Visualizar Demandas" },
  { id: "create_demandas", label: "Criar Demandas" },
  { id: "edit_demandas", label: "Editar Demandas" },
  { id: "delete_demandas", label: "Excluir Demandas" },
  { id: "view_agenda", label: "Visualizar Agenda" },
  { id: "create_agenda", label: "Criar Eventos" },
  { id: "edit_agenda", label: "Editar Eventos" },
  { id: "delete_agenda", label: "Excluir Eventos" },
  { id: "view_roteiros", label: "Visualizar Roteiros" },
  { id: "create_roteiros", label: "Criar Roteiros" },
  { id: "edit_roteiros", label: "Editar Roteiros" },
  { id: "delete_roteiros", label: "Excluir Roteiros" },
  { id: "view_mapa", label: "Visualizar Mapa" },
  { id: "view_relatorios", label: "Visualizar Relatórios" },
];

export function CreateTemplateDialog({
  open,
  onOpenChange,
  gabineteId,
  onSuccess,
  editingTemplate,
}: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setNome(editingTemplate.nome);
        setDescricao(editingTemplate.descricao || "");
        setSelectedPermissions(
          editingTemplate.permission_template_permissions.map((p) => p.permission)
        );
      } else {
        setNome("");
        setDescricao("");
        setSelectedPermissions([]);
      }
    }
  }, [open, editingTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTemplate) {
        // Atualizar template existente
        const { error: updateError } = await supabase
          .from("permission_templates")
          .update({ nome, descricao: descricao || null })
          .eq("id", editingTemplate.id);

        if (updateError) throw updateError;

        // Deletar permissões antigas
        const { error: deleteError } = await supabase
          .from("permission_template_permissions")
          .delete()
          .eq("template_id", editingTemplate.id);

        if (deleteError) throw deleteError;

        // Inserir novas permissões
        if (selectedPermissions.length > 0) {
          const { error: insertError } = await supabase
            .from("permission_template_permissions")
            .insert(
              selectedPermissions.map((perm) => ({
                template_id: editingTemplate.id,
                permission: perm as any,
              }))
            );

          if (insertError) throw insertError;
        }

        toast.success("Template atualizado com sucesso");
      } else {
        // Criar novo template
        const { data: templateData, error: templateError } = await supabase
          .from("permission_templates")
          .insert({
            gabinete_id: gabineteId,
            nome,
            descricao: descricao || null,
          })
          .select()
          .single();

        if (templateError) throw templateError;

        // Inserir permissões
        if (selectedPermissions.length > 0) {
          const { error: permsError } = await supabase
            .from("permission_template_permissions")
            .insert(
              selectedPermissions.map((perm) => ({
                template_id: templateData.id,
                permission: perm as any,
              }))
            );

          if (permsError) throw permsError;
        }

        toast.success("Template criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar template:", error);
      toast.error(error.message || "Erro ao salvar template");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? "Editar Template" : "Novo Template de Permissões"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Assessor de Rua"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva as responsabilidades deste papel..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Permissões *</Label>
            <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`template-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <Label
                    htmlFor={`template-${permission.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || selectedPermissions.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
