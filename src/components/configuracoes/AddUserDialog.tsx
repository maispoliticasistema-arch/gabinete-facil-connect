import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { logAudit } from "@/lib/auditLog";
import { Badge } from "@/components/ui/badge";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gabineteId: string;
  onSuccess: () => void;
}

const PERMISSIONS = [
  { id: "view_eleitores", label: "Visualizar Eleitores" },
  { id: "create_eleitores", label: "Cadastrar / Editar Eleitores" },
  { id: "delete_eleitores", label: "Excluir Eleitores" },
  { id: "view_demandas", label: "Visualizar Demandas" },
  { id: "create_demandas", label: "Criar / Editar Demandas" },
  { id: "delete_demandas", label: "Excluir Demandas" },
  { id: "view_agenda", label: "Acessar Agenda" },
  { id: "create_agenda", label: "Criar / Editar Eventos" },
  { id: "delete_agenda", label: "Excluir Eventos" },
  { id: "view_roteiros", label: "Visualizar Roteiros" },
  { id: "create_roteiros", label: "Criar / Editar Roteiros" },
  { id: "delete_roteiros", label: "Excluir Roteiros" },
  { id: "view_mapa", label: "Acessar Mapa" },
  { id: "view_relatorios", label: "Acessar Relatórios" },
  { id: "manage_users", label: "Gerenciar Usuários" },
];

export function AddUserDialog({ open, onOpenChange, gabineteId, onSuccess }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome_completo: "",
    telefone: "",
    role: "assessor" as "owner" | "admin" | "assessor",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    if (open && formData.role === "assessor") {
      fetchTemplates();
    }
  }, [open, formData.role]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("permission_templates")
        .select(`
          id,
          nome,
          permission_template_permissions (
            permission
          )
        `)
        .eq("gabinete_id", gabineteId);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") {
      setSelectedPermissions([]);
      return;
    }
    
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedPermissions(
        template.permission_template_permissions.map((p: any) => p.permission)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar usuário via edge function para não deslogar o admin
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          gabinete_id: gabineteId,
          role: formData.role,
          permissions: formData.role === "assessor" ? selectedPermissions : [],
        }
      });

      if (functionError) throw functionError;
      if (functionData?.error) throw new Error(functionData.error);

      const userGabinete = functionData.userGabinete;

      // Registrar log de auditoria
      await logAudit({
        gabineteId: gabineteId,
        action: 'user_created',
        entityType: 'user',
        details: { 
          email: formData.email,
          nome: formData.nome_completo,
          role: formData.role 
        }
      });

      toast.success("Usuário criado com sucesso!");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        nome_completo: "",
        telefone: "",
        role: "assessor",
      });
      setSelectedPermissions([]);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail de Login *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Inicial *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função / Papel *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assessor">Assessor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "assessor" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template de Permissões</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template ou personalize" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizar Permissões</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Permissões Selecionadas</Label>
                    {selectedTemplate !== "custom" && (
                      <Badge variant="secondary">Template Aplicado</Badge>
                    )}
                  </div>
                  <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                    {PERMISSIONS.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          disabled={selectedTemplate !== "custom"}
                        />
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(formData.role === "admin" || formData.role === "owner") && (
            <p className="text-sm text-muted-foreground">
              {formData.role === "admin" ? "Administradores" : "Proprietários"} têm acesso total a todas as funcionalidades.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
