import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGabinete } from '@/contexts/GabineteContext';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportEleitoresDialogProps {
  onEleitoresImported: () => void;
}

const CAMPOS_ELEITOR = [
  { value: 'nome_completo', label: 'Nome Completo *' },
  { value: 'cpf', label: 'CPF' },
  { value: 'rg', label: 'RG' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'data_nascimento', label: 'Data de Nascimento' },
  { value: 'endereco', label: 'Endereço' },
  { value: 'numero', label: 'Número' },
  { value: 'bairro', label: 'Bairro' },
  { value: 'cidade', label: 'Cidade' },
  { value: 'estado', label: 'Estado' },
  { value: 'cep', label: 'CEP' },
  { value: 'profissao', label: 'Profissão' },
  { value: 'observacoes', label: 'Observações' },
  { value: 'ignore', label: '--- Ignorar ---' },
];

export function ImportEleitoresDialog({ onEleitoresImported }: ImportEleitoresDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo CSV ou XLSX',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    readFile(selectedFile);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          toast({
            title: 'Arquivo vazio',
            description: 'O arquivo não contém dados',
            variant: 'destructive',
          });
          return;
        }

        const fileHeaders = jsonData[0] as string[];
        const dataRows = jsonData.slice(1, 6); // Preview primeiras 5 linhas

        setHeaders(fileHeaders);
        setPreviewData(dataRows);

        // Auto-mapear colunas baseado em nomes similares
        const autoMapping: Record<string, string> = {};
        fileHeaders.forEach((header) => {
          const normalized = header.toLowerCase().trim();
          if (normalized.includes('nome')) autoMapping[header] = 'nome_completo';
          else if (normalized.includes('cpf')) autoMapping[header] = 'cpf';
          else if (normalized.includes('rg')) autoMapping[header] = 'rg';
          else if (normalized.includes('telefone') || normalized.includes('celular')) autoMapping[header] = 'telefone';
          else if (normalized.includes('email') || normalized.includes('e-mail')) autoMapping[header] = 'email';
          else if (normalized.includes('nascimento') || normalized.includes('data')) autoMapping[header] = 'data_nascimento';
          else if (normalized.includes('endereco') || normalized.includes('endereço')) autoMapping[header] = 'endereco';
          else if (normalized.includes('numero') || normalized.includes('número') || normalized === 'nro' || normalized === 'nº') autoMapping[header] = 'numero';
          else if (normalized.includes('bairro')) autoMapping[header] = 'bairro';
          else if (normalized.includes('cidade')) autoMapping[header] = 'cidade';
          else if (normalized.includes('estado') || normalized.includes('uf')) autoMapping[header] = 'estado';
          else if (normalized.includes('cep')) autoMapping[header] = 'cep';
          else if (normalized.includes('profissao') || normalized.includes('profissão')) autoMapping[header] = 'profissao';
          else if (normalized.includes('observa')) autoMapping[header] = 'observacoes';
          else autoMapping[header] = 'ignore';
        });

        setColumnMapping(autoMapping);
      } catch (error) {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível processar o arquivo',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!file || !currentGabinete) {
      console.log('Missing file or gabinete:', { file: !!file, gabinete: !!currentGabinete });
      return;
    }

    // Validar que ao menos nome_completo foi mapeado
    const hasNomeCompleto = Object.values(columnMapping).includes('nome_completo');
    if (!hasNomeCompleto) {
      toast({
        title: 'Mapeamento inválido',
        description: 'É necessário mapear a coluna "Nome Completo"',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    console.log('Starting import...');

    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
        console.error('FileReader error');
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível ler o arquivo',
          variant: 'destructive',
        });
        setImporting(false);
      };

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          console.log('File loaded, parsing...');
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log('Parsed rows:', jsonData.length);

          const eleitores = jsonData.map((row: any) => {
            const eleitor: any = {
              gabinete_id: currentGabinete.gabinete_id,
            };

            headers.forEach((header) => {
              const campo = columnMapping[header];
              if (campo && campo !== 'ignore' && row[header]) {
                let valor = row[header];
                
                // Convert data_nascimento to YYYY-MM-DD format
                if (campo === 'data_nascimento' && valor) {
                  try {
                    // Se for um número (serial do Excel), converte
                    if (typeof valor === 'number') {
                      // Excel serial date: dias desde 1900-01-01
                      const excelEpoch = new Date(1900, 0, 1);
                      const msPerDay = 24 * 60 * 60 * 1000;
                      // Excel tem um bug: considera 1900 como ano bissexto
                      const daysOffset = valor > 59 ? valor - 2 : valor - 1;
                      const date = new Date(excelEpoch.getTime() + daysOffset * msPerDay);
                      
                      if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        valor = `${year}-${month}-${day}`;
                      } else {
                        valor = null; // Data inválida
                      }
                    } 
                    // Se for string com barra (DD/MM/AAAA)
                    else if (String(valor).includes('/')) {
                      const parts = String(valor).split('/');
                      if (parts.length === 3) {
                        const [dia, mes, ano] = parts;
                        const year = ano.length === 2 ? `20${ano}` : ano;
                        valor = `${year}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                      }
                    }
                    // Se já estiver em formato ISO ou outro formato
                    else {
                      valor = String(valor).trim();
                    }
                  } catch (e) {
                    console.error('Erro ao converter data:', e);
                    valor = null; // Ignora datas com erro
                  }
                } else {
                  valor = String(valor).trim();
                }
                
                if (valor) {
                  eleitor[campo] = valor;
                }
              }
            });

            return eleitor;
          }).filter((e: any) => e.nome_completo); // Apenas registros com nome

          console.log('Eleitores to import:', eleitores.length);

          if (eleitores.length === 0) {
            toast({
              title: 'Nenhum eleitor para importar',
              description: 'Não foram encontrados registros válidos',
              variant: 'destructive',
            });
            setImporting(false);
            return;
          }

          console.log('Inserting into database...');
          const { data: insertedData, error } = await supabase
            .from('eleitores')
            .insert(eleitores)
            .select();

          if (error) {
            console.error('Database error:', error);
            throw error;
          }

          console.log('Import successful:', insertedData?.length);

          toast({
            title: 'Importação concluída',
            description: `${eleitores.length} eleitor(es) importado(s) com sucesso`,
          });

          setOpen(false);
          setFile(null);
          setPreviewData([]);
          setHeaders([]);
          setColumnMapping({});
          setImporting(false);
          onEleitoresImported();
        } catch (error: any) {
          console.error('Error in onload:', error);
          toast({
            title: 'Erro ao importar',
            description: error.message || 'Erro desconhecido',
            variant: 'destructive',
          });
          setImporting(false);
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Error in handleImport:', error);
      toast({
        title: 'Erro ao importar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Importar Eleitores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Eleitores</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou XLSX e configure o mapeamento das colunas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!file ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um arquivo CSV ou XLSX
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="secondary" asChild>
                  <span>Escolher Arquivo</span>
                </Button>
              </Label>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setHeaders([]);
                    setColumnMapping({});
                  }}
                >
                  Trocar arquivo
                </Button>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Pré-visualização e Mapeamento</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure qual campo cada coluna representa (primeiras 5 linhas)
                    </p>
                  </div>
                  <div className="border rounded-lg overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b-2">
                          {headers.map((header, i) => (
                            <th key={i} className="px-3 py-3 min-w-[200px] text-left">
                              <div className="font-semibold text-sm">
                                {header}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-muted">
                          {headers.map((header, i) => (
                            <th key={i} className="px-3 py-2">
                              <Select
                                value={columnMapping[header] || 'ignore'}
                                onValueChange={(value) =>
                                  setColumnMapping((prev) => ({ ...prev, [header]: value }))
                                }
                              >
                                <SelectTrigger className="h-9 text-xs bg-background">
                                  <SelectValue placeholder="Mapear para..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {CAMPOS_ELEITOR.map((campo) => (
                                    <SelectItem key={campo.value} value={campo.value}>
                                      {campo.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row: any, i) => (
                          <tr key={i} className="border-t">
                            {headers.map((header, j) => (
                              <td key={j} className="px-3 py-2 text-xs">
                                {row[j]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
