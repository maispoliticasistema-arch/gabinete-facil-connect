import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserX, UserCheck, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditUserDialog } from "./EditUserDialog";

interface UsersTableProps {
  users: any[];
  loading: boolean;
  onRefresh: () => void;
  gabineteId: string;
}

export function UsersTable({ users, loading, onRefresh, gabineteId }: UsersTableProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; userGabineteId: string } | null>(null);

  const handleEditUser = (userId: string, userGabineteId: string) => {
    setSelectedUser({ userId, userGabineteId });
    setEditDialogOpen(true);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("user_gabinetes")
        .update({ ativo: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentStatus ? "Usuário desativado" : "Usuário ativado");
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do usuário");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cadastrado em</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum usuário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.profiles?.nome_completo || "N/A"}</p>
                    {user.profiles?.telefone && (
                      <p className="text-sm text-muted-foreground">{user.profiles.telefone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                    {user.role === "owner" ? "Proprietário" : user.role === "admin" ? "Admin" : "Assessor"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.ativo ? "default" : "secondary"}>
                    {user.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user.user_id, user.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.ativo)}>
                        {user.ativo ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={selectedUser.userId}
          userGabineteId={selectedUser.userGabineteId}
          gabineteId={gabineteId}
          onSuccess={() => {
            onRefresh();
            setEditDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
