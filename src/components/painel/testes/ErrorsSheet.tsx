import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ErrorEntry {
  id: string;
  created_at: string;
  endpoint: string | null;
  status_code: number | null;
  duration_ms: number;
  metadata: any;
}

interface ErrorsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ErrorEntry[];
}

export function ErrorsSheet({ open, onOpenChange, errors }: ErrorsSheetProps) {
  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode || statusCode === 0) return 'destructive';
    if (statusCode >= 500) return 'destructive';
    if (statusCode >= 400) return 'destructive';
    return 'default';
  };

  const getStatusText = (statusCode: number | null) => {
    if (!statusCode || statusCode === 0) return 'Erro de Conexão';
    if (statusCode >= 500) return 'Erro do Servidor';
    if (statusCode >= 400) return 'Erro do Cliente';
    return 'Erro';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Erros Registrados
          </SheetTitle>
          <SheetDescription>
            Últimos erros detectados durante os testes e requisições
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {errors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum erro registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div 
                  key={error.id}
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(error.status_code) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {error.status_code || 0}
                      </Badge>
                      <span className="text-sm font-medium">
                        {getStatusText(error.status_code)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(error.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                  </div>

                  {error.endpoint && (
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {error.endpoint}
                      </code>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Duração: {error.duration_ms}ms</span>
                  </div>

                  {error.metadata && Object.keys(error.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
