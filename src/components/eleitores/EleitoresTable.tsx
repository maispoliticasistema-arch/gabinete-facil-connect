import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, MapPin, Calendar, Pencil, Trash2 } from 'lucide-react';
import { EditEleitoresDialog } from './EditEleitoresDialog';
import { DeleteEleitoresDialog } from './DeleteEleitoresDialog';
import { EleitoresTagsSelect } from './EleitoresTagsSelect';
import { EleitoresNivelSelect } from './EleitoresNivelSelect';
import { usePermissions } from '@/hooks/usePermissions';

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  created_at: string;
  nivel_envolvimento_id: string | null;
}

interface EleitoresTableProps {
  eleitores: Eleitor[];
  onEleitoresUpdated: () => void;
  onEleitoresClick?: (eleitor: Eleitor) => void;
}

export const EleitoresTable = ({ eleitores, onEleitoresUpdated, onEleitoresClick }: EleitoresTableProps) => {
  const [editingEleitor, setEditingEleitor] = useState<Eleitor | null>(null);
  const [deletingEleitor, setDeletingEleitor] = useState<Eleitor | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const handleEdit = (eleitor: Eleitor) => {
    setEditingEleitor(eleitor);
    setEditDialogOpen(true);
  };

  const handleDelete = (eleitor: Eleitor) => {
    setDeletingEleitor(eleitor);
    setDeleteDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatWhatsAppLink = (telefone: string) => {
    const cleanNumber = telefone.replace(/\D/g, '');
    return `https://wa.me/55${cleanNumber}`;
  };

  return (
    <>
      <EditEleitoresDialog
        eleitor={editingEleitor}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEleitoresUpdated={onEleitoresUpdated}
      />
      <DeleteEleitoresDialog
        eleitor={deletingEleitor}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onEleitoresDeleted={onEleitoresUpdated}
      />
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Eleitor</TableHead>
              <TableHead className="min-w-[150px]">Contato</TableHead>
              <TableHead className="min-w-[150px] hidden lg:table-cell">Tags</TableHead>
              <TableHead className="min-w-[140px] hidden xl:table-cell">Nível</TableHead>
              <TableHead className="min-w-[150px] hidden md:table-cell">Localização</TableHead>
              <TableHead className="min-w-[120px] hidden lg:table-cell">Data Nasc.</TableHead>
              <TableHead className="min-w-[100px] hidden xl:table-cell">Cadastro</TableHead>
              <TableHead className="text-right min-w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eleitores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum eleitor cadastrado ainda
                </TableCell>
              </TableRow>
            ) : (
              eleitores.map((eleitor) => (
                <TableRow 
                  key={eleitor.id}
                  onClick={() => onEleitoresClick?.(eleitor)}
                  className="cursor-pointer"
                >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(eleitor.nome_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-sm truncate max-w-[150px]">
                      {eleitor.nome_completo}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {eleitor.telefone && (
                      <a 
                        href={formatWhatsAppLink(eleitor.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                      >
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{eleitor.telefone}</span>
                      </a>
                    )}
                    {eleitor.email && (
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px]">{eleitor.email}</span>
                      </div>
                    )}
                    {!eleitor.telefone && !eleitor.email && (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <EleitoresTagsSelect 
                    eleitorId={eleitor.id} 
                    onTagsChange={onEleitoresUpdated}
                  />
                </TableCell>
                <TableCell className="hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
                  <EleitoresNivelSelect 
                    eleitorId={eleitor.id}
                    currentNivelId={eleitor.nivel_envolvimento_id}
                    onNivelChange={onEleitoresUpdated}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {eleitor.cidade || eleitor.estado ? (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[130px]">
                        {[eleitor.cidade, eleitor.estado].filter(Boolean).join(' - ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {eleitor.data_nascimento ? (
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{formatDate(eleitor.data_nascimento)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(eleitor.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission('edit_eleitores') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(eleitor);
                          }}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {hasPermission('delete_eleitores') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(eleitor);
                          }}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
