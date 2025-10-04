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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface Eleitor {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  created_at: string;
}

interface EleitoresTableProps {
  eleitores: Eleitor[];
}

export const EleitoresTable = ({ eleitores }: EleitoresTableProps) => {
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

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Eleitor</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Data Nascimento</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eleitores.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum eleitor cadastrado ainda
              </TableCell>
            </TableRow>
          ) : (
            eleitores.map((eleitor) => (
              <TableRow key={eleitor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(eleitor.nome_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{eleitor.nome_completo}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {eleitor.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{eleitor.telefone}</span>
                      </div>
                    )}
                    {eleitor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{eleitor.email}</span>
                      </div>
                    )}
                    {!eleitor.telefone && !eleitor.email && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {eleitor.endereco || eleitor.cidade ? (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div className="space-y-0.5">
                        {eleitor.endereco && <div>{eleitor.endereco}</div>}
                        {(eleitor.cidade || eleitor.estado) && (
                          <div className="text-muted-foreground">
                            {[eleitor.cidade, eleitor.estado].filter(Boolean).join(' - ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {eleitor.data_nascimento ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(eleitor.data_nascimento)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(eleitor.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
