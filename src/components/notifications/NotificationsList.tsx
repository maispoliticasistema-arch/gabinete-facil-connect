import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationsListProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  demanda_atribuida: '📋',
  demanda_atualizada: '📝',
  demanda_comentario: '💬',
  demanda_concluida: '✅',
  evento_proximo: '📅',
  roteiro_atribuido: '🗺️',
};

export function NotificationsList({ onClose }: NotificationsListProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navegar para a entidade relacionada
    if (notification.entity_type === 'demanda' && notification.entity_id) {
      navigate('/demandas');
      onClose();
    } else if (notification.entity_type === 'agenda' && notification.entity_id) {
      navigate('/agenda');
      onClose();
    } else if (notification.entity_type === 'roteiro' && notification.entity_id) {
      navigate('/roteiros');
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full text-left p-4 hover:bg-accent transition-colors",
                  !notification.read && "bg-accent/50"
                )}
              >
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {NOTIFICATION_ICONS[notification.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
