import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Edit, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Site {
  id: string;
  slug: string;
  site_path: string;
  titulo: string;
  publicado: boolean;
  updated_at: string;
}

interface SitesListProps {
  sites: Site[];
  currentSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  onCreateSite: () => void;
  onDeleteSite: (siteId: string) => void;
}

export const SitesList = ({ 
  sites, 
  currentSiteId, 
  onSelectSite, 
  onCreateSite,
  onDeleteSite 
}: SitesListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meus Sites</CardTitle>
            <CardDescription>
              {sites.length} site(s) criado(s)
            </CardDescription>
          </div>
          <Button onClick={onCreateSite} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Site
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum site criado ainda</p>
              <p className="text-sm">Clique em "Novo Site" para começar</p>
            </div>
          ) : (
            sites.map((site) => (
              <div
                key={site.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer ${
                  currentSiteId === site.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelectSite(site.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{site.titulo || 'Sem título'}</h4>
                    {site.publicado ? (
                      <Badge variant="default" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Publicado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    /{site.slug}/{site.site_path}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizado em {format(new Date(site.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {site.publicado && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`/${site.slug}/${site.site_path}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este site? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteSite(site.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
