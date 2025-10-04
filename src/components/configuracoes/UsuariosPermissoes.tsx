import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AddUserDialog } from "./AddUserDialog";
import { UsersTable } from "./UsersTable";

interface UsuariosPermissoesProps {
  gabineteId: string;
}

export function UsuariosPermissoes({ gabineteId }: UsuariosPermissoesProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      console.log("Buscando usuários para o gabinete:", gabineteId);
      
      const { data, error } = await supabase
        .from("user_gabinetes")
        .select(`
          id,
          user_id,
          role,
          ativo,
          created_at,
          profiles!inner (
            nome_completo,
            telefone
          )
        `)
        .eq("gabinete_id", gabineteId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro na query:", error);
        throw error;
      }
      
      console.log("Usuários encontrados:", data?.length || 0);
      console.log("Dados:", data);
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [gabineteId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Usuários e Permissões</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros da equipe e suas permissões
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <UsersTable 
        users={users} 
        loading={loading} 
        onRefresh={fetchUsers}
        gabineteId={gabineteId}
      />

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        gabineteId={gabineteId}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
