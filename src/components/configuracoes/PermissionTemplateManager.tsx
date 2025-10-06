import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PermissionTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  permission_template_permissions: { permission: string }[];
}

interface PermissionTemplateManagerProps {
  gabineteId: string;
}

export function PermissionTemplateManager({ gabineteId }: PermissionTemplateManagerProps) {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("permission_templates")
        .select(`
          id,
          nome,
          descricao,
          created_at,
          permission_template_permissions (
            permission
          )
        `)
        .eq("gabinete_id", gabineteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
      toast.error("Erro ao carregar templates de permissões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [gabineteId]);

  const handleEdit = (template: PermissionTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from("permission_templates")
        .delete()
        .eq("id", templateToDelete);

      if (error) throw error;

      toast.success("Template excluído com sucesso");
      fetchTemplates();
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      toast.error("Erro ao excluir template");
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  if (loading) {
    return <div>Carregando templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Permissões</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie templates reutilizáveis para facilitar o gerenciamento de permissões
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{template.nome}</h4>
                  {template.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.descricao}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      setTemplateToDelete(template.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.permission_template_permissions.length > 0 ? (
                  template.permission_template_permissions.map((perm, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {perm.permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma permissão</p>
                )}
              </div>
            </div>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <p className="text-muted-foreground">
              Nenhum template criado ainda. Crie seu primeiro template para facilitar o gerenciamento de permissões.
            </p>
          </Card>
        )}
      </div>

      <CreateTemplateDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        gabineteId={gabineteId}
        onSuccess={fetchTemplates}
        editingTemplate={editingTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
