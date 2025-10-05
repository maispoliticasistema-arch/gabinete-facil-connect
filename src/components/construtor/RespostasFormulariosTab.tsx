import { useState, useEffect } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, FileText, Trash2, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FormSubmission {
  id: string;
  form_id: string;
  form_title: string;
  data: Record<string, any>;
  created_at: string;
}

export const RespostasFormulariosTab = () => {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [forms, setForms] = useState<Record<string, FormSubmission[]>>({});

  useEffect(() => {
    if (currentGabinete) {
      loadSubmissions();
    }
  }, [currentGabinete]);

  const loadSubmissions = async () => {
    if (!currentGabinete) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_form_submissions')
        .select('*')
        .eq('gabinete_id', currentGabinete.gabinetes.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map(sub => ({
        ...sub,
        data: sub.data as Record<string, any>
      }));

      setSubmissions(transformedData);

      // Agrupar por formulário
      const grouped = transformedData.reduce((acc, sub) => {
        if (!acc[sub.form_id]) {
          acc[sub.form_id] = [];
        }
        acc[sub.form_id].push(sub);
        return acc;
      }, {} as Record<string, FormSubmission[]>);

      setForms(grouped);
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as respostas dos formulários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portal_form_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Resposta excluída com sucesso.',
      });

      loadSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Erro ao excluir submissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a resposta.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma resposta ainda</h3>
          <p className="text-muted-foreground">
            As respostas dos formulários customizados do seu portal aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Lista de Formulários */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Formulários</CardTitle>
          <CardDescription>
            {Object.keys(forms).length} formulário(s) com respostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Tabs defaultValue={Object.keys(forms)[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: '1fr' }}>
                {Object.keys(forms).map((formId) => (
                  <TabsTrigger key={formId} value={formId} className="text-left">
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium truncate w-full">
                        {forms[formId][0]?.form_title || 'Sem título'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {forms[formId].length} resposta(s)
                      </Badge>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(forms).map((formId) => (
                <TabsContent key={formId} value={formId} className="space-y-2 mt-4">
                  {forms[formId].map((submission) => (
                    <Button
                      key={submission.id}
                      variant={selectedSubmission?.id === submission.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center gap-2 w-full">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">
                            {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detalhes da Resposta */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes da Resposta
          </CardTitle>
          <CardDescription>
            {selectedSubmission
              ? `Resposta de ${format(new Date(selectedSubmission.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
              : 'Selecione uma resposta para ver os detalhes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedSubmission ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedSubmission.form_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Recebido em {format(new Date(selectedSubmission.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(selectedSubmission.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Dados Submetidos:</h4>
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        {key}
                      </Label>
                      <p className="text-sm p-3 bg-muted rounded-md">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma resposta ao lado para visualizar os detalhes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
