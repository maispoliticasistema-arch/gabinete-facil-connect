import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userGabineteId: string;
  gabineteId: string;
  onSuccess: () => void;
}

const PERMISSIONS = [
  { id: 'view_eleitores', label: 'Visualizar Eleitores' },
  { id: 'create_eleitores', label: 'Criar Eleitores' },
  { id: 'edit_eleitores', label: 'Editar Eleitores' },
  { id: 'delete_eleitores', label: 'Excluir Eleitores' },
  { id: 'import_eleitores', label: 'Importar Eleitores' },
  { id: 'export_eleitores', label: 'Exportar Dados' },
  { id: 'manage_tags', label: 'Gerenciar Tags/Etiquetas' },
  { id: 'view_demandas', label: 'Visualizar Demandas' },
  { id: 'create_demandas', label: 'Criar Demandas' },
  { id: 'edit_demandas', label: 'Editar Demandas' },
  { id: 'delete_demandas', label: 'Excluir Demandas' },
  { id: 'view_agenda', label: 'Visualizar Agenda' },
  { id: 'create_agenda', label: 'Criar Eventos' },
  { id: 'edit_agenda', label: 'Editar Eventos' },
  { id: 'delete_agenda', label: 'Excluir Eventos' },
  { id: 'view_roteiros', label: 'Visualizar Roteiros' },
  { id: 'create_roteiros', label: 'Criar Roteiros' },
  { id: 'edit_roteiros', label: 'Editar Roteiros' },
  { id: 'delete_roteiros', label: 'Excluir Roteiros' },
  { id: 'view_mapa', label: 'Visualizar Mapa' },
  { id: 'view_relatorios', label: 'Visualizar Relatórios' },
];

export function EditUserDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userGabineteId,
  gabineteId, 
  onSuccess 
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "assessor">("assessor");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open, userId, userGabineteId]);

  const loadUserData = async () => {
    try {
      // Buscar dados do perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("nome_completo, telefone")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      setNomeCompleto(profileData.nome_completo || "");
      setTelefone(profileData.telefone || "");

      // Buscar role
      const { data: gabineteData, error: gabineteError } = await supabase
        .from("user_gabinetes")
        .select("role")
        .eq("id", userGabineteId)
        .single();

      if (gabineteError) throw gabineteError;

      setRole(gabineteData.role);

      // Buscar permissões (se for assessor)
      if (gabineteData.role === "assessor") {
        const { data: permsData, error: permsError } = await supabase
          .from("user_permissions")
          .select("permission")
          .eq("user_gabinete_id", userGabineteId);

        if (permsError) throw permsError;

        setSelectedPermissions(permsData.map(p => p.permission));
      } else {
        setSelectedPermissions([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do usuário");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome_completo: nomeCompleto,
          telefone: telefone || null,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Atualizar role
      const { error: roleError } = await supabase
        .from("user_gabinetes")
        .update({ role })
        .eq("id", userGabineteId);

      if (roleError) throw roleError;

      // Atualizar permissões (se for assessor)
      if (role === "assessor") {
        // Deletar permissões antigas
        const { error: deleteError } = await supabase
          .from("user_permissions")
          .delete()
          .eq("user_gabinete_id", userGabineteId);

        if (deleteError) throw deleteError;

        // Inserir novas permissões
        if (selectedPermissions.length > 0) {
          const { error: insertError } = await supabase
            .from("user_permissions")
            .insert(
              selectedPermissions.map(perm => ({
                user_gabinete_id: userGabineteId,
                permission: perm as any,
              }))
            );

          if (insertError) throw insertError;
        }
      } else {
        // Se mudou de assessor para admin/owner, deletar permissões
        const { error: deleteError } = await supabase
          .from("user_permissions")
          .delete()
          .eq("user_gabinete_id", userGabineteId);

        if (deleteError) throw deleteError;
      }

      toast.success("Usuário atualizado com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
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
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função *</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Proprietário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="assessor">Assessor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "assessor" && (
            <div className="space-y-3">
              <Label>Permissões</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={perm.id}
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <label
                      htmlFor={perm.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}