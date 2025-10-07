import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AccessRequest {
  id: string;
  user_id: string;
  status: string;
  mensagem: string | null;
  created_at: string;
  profiles: {
    nome_completo: string;
  };
}

export const SolicitacoesAcesso = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (currentGabinete?.gabinete_id) {
      fetchRequests();
    }
  }, [currentGabinete]);

  const fetchRequests = async () => {
    if (!currentGabinete?.gabinete_id) return;

    try {
      const { data, error } = await supabase
        .from('gabinete_access_requests')
        .select(`
          id,
          user_id,
          status,
          mensagem,
          created_at
        `)
        .eq('gabinete_id', currentGabinete.gabinete_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis separadamente
      if (data && data.length > 0) {
        const userIds = data.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome_completo')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const requestsWithProfiles = data.map(request => ({
          ...request,
          profiles: {
            nome_completo: profilesData?.find(p => p.id === request.user_id)?.nome_completo || 'Usuário'
          }
        }));

        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, selectedRole: 'assessor' | 'admin' = 'assessor') => {
    try {
      setActionLoading(requestId);
      const { error } = await supabase
        .rpc('approve_access_request', {
          request_id: requestId,
          assigned_role: selectedRole as any,
        });

      if (error) throw error;

      toast({
        title: 'Solicitação aprovada',
        description: 'O usuário foi adicionado ao gabinete.',
      });
      
      fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const { error } = await supabase
        .rpc('reject_access_request', {
          request_id: requestId,
        });

      if (error) throw error;

      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação foi recusada.',
      });
      
      fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any; icon: any }> = {
      pendente: { 
        label: 'Pendente', 
        variant: 'secondary',
        icon: Clock 
      },
      aprovado: { 
        label: 'Aprovado', 
        variant: 'default',
        icon: CheckCircle2 
      },
      rejeitado: { 
        label: 'Rejeitado', 
        variant: 'destructive',
        icon: XCircle 
      },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de Acesso</CardTitle>
        <CardDescription>
          Gerencie as solicitações de acesso ao gabinete via código de convite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma solicitação de acesso pendente.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={actionLoading === request.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RequestCardProps {
  request: AccessRequest;
  onApprove: (id: string, role: 'assessor' | 'admin') => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}

const RequestCard = ({ request, onApprove, onReject, isLoading }: RequestCardProps) => {
  const [selectedRole, setSelectedRole] = useState<'assessor' | 'admin'>('assessor');

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{request.profiles.nome_completo}</p>
          {request.status && (
            <Badge variant="secondary">{request.status}</Badge>
          )}
        </div>
        {request.mensagem && (
          <p className="text-sm text-muted-foreground">{request.mensagem}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {request.status === 'pendente' && (
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Cargo</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => setSelectedRole(value as 'assessor' | 'admin')}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assessor">Assessor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => onApprove(request.id, selectedRole)}
            disabled={isLoading}
            className="gap-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(request.id)}
            disabled={isLoading}
            className="gap-1"
          >
            <XCircle className="h-4 w-4" />
            Rejeitar
          </Button>
        </div>
      )}
    </div>
  );
};
