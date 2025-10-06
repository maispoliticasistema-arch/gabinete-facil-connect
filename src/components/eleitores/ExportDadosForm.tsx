import { useState } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Table, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { logAudit } from '@/lib/auditLog';
import { format } from 'date-fns';

interface ExportDadosFormProps {
  searchTerm: string;
  selectedBairro: string;
  selectedCidade: string;
  selectedTags: string[];
  selectedAssessor: string;
  onClose: () => void;
}

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
  cpf: string | null;
  rg: string | null;
  profissao: string | null;
  observacoes: string | null;
}

const camposDisponiveis = [
  { id: 'nome_completo', label: 'Nome Completo', obrigatorio: true },
  { id: 'telefone', label: 'Telefone' },
  { id: 'email', label: 'E-mail' },
  { id: 'data_nascimento', label: 'Data de Nascimento' },
  { id: 'cpf', label: 'CPF' },
  { id: 'rg', label: 'RG' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'numero', label: 'Número' },
  { id: 'bairro', label: 'Bairro' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'estado', label: 'Estado' },
  { id: 'cep', label: 'CEP' },
  { id: 'profissao', label: 'Profissão' },
  { id: 'observacoes', label: 'Observações' },
];

export function ExportDadosForm({
  searchTerm,
  selectedBairro,
  selectedCidade,
  selectedTags,
  selectedAssessor,
  onClose,
}: ExportDadosFormProps) {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx');
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>(['nome_completo']);

  const toggleCampo = (campoId: string) => {
    const campo = camposDisponiveis.find(c => c.id === campoId);
    if (campo?.obrigatorio) return; // Não permitir desmarcar campos obrigatórios
    
    setCamposSelecionados(prev =>
      prev.includes(campoId)
        ? prev.filter(id => id !== campoId)
        : [...prev, campoId]
    );
  };

  const buscarEleitores = async (): Promise<Eleitor[]> => {
    if (!currentGabinete) return [];

    let query = supabase
      .from('eleitores')
      .select('*')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .is('deleted_at', null);

    if (searchTerm.trim()) {
      query = query.or(`nome_completo.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%`);
    }

    if (selectedBairro) {
      query = query.eq('bairro', selectedBairro);
    }

    if (selectedCidade) {
      query = query.eq('cidade', selectedCidade);
    }

    if (selectedTags.length > 0) {
      const { data: eleitoresComTags } = await supabase
        .from('eleitor_tags')
        .select('eleitor_id')
        .in('tag_id', selectedTags);

      if (eleitoresComTags && eleitoresComTags.length > 0) {
        const eleitoresIds = eleitoresComTags.map((et) => et.eleitor_id);
        query = query.in('id', eleitoresIds);
      } else {
        return [];
      }
    }

    if (selectedAssessor) {
      query = query.eq('cadastrado_por', selectedAssessor);
    }

    const { data, error } = await query.order('nome_completo', { ascending: true });

    if (error) throw error;
    return (data || []) as Eleitor[];
  };

  const formatarValor = (valor: any, campo: string): string => {
    if (valor === null || valor === undefined) return '';
    
    if (campo === 'data_nascimento' && valor) {
      try {
        return format(new Date(valor), 'dd/MM/yyyy');
      } catch {
        return valor;
      }
    }
    
    return String(valor);
  };

  const exportarCSV = (eleitores: Eleitor[]) => {
    const headers = camposSelecionados
      .map(id => camposDisponiveis.find(c => c.id === id)?.label || id);

    const rows = eleitores.map(eleitor =>
      camposSelecionados.map(campo => formatarValor(eleitor[campo as keyof Eleitor], campo))
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eleitores_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const exportarXLSX = (eleitores: Eleitor[]) => {
    const headers = camposSelecionados
      .map(id => camposDisponiveis.find(c => c.id === id)?.label || id);

    const data = eleitores.map(eleitor =>
      camposSelecionados.reduce((obj, campo) => {
        const label = camposDisponiveis.find(c => c.id === campo)?.label || campo;
        obj[label] = formatarValor(eleitor[campo as keyof Eleitor], campo);
        return obj;
      }, {} as Record<string, string>)
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eleitores');

    // Ajustar largura das colunas
    const maxWidth = 50;
    const colWidths = headers.map(header => ({
      wch: Math.min(header.length + 5, maxWidth)
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `eleitores_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
  };

  const exportarPDF = (eleitores: Eleitor[]) => {
    const doc = new jsPDF({
      orientation: camposSelecionados.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Eleitores', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
    doc.text(`Total de registros: ${eleitores.length}`, 14, 27);

    // Tabela
    const headers = camposSelecionados
      .map(id => camposDisponiveis.find(c => c.id === id)?.label || id);

    const rows = eleitores.map(eleitor =>
      camposSelecionados.map(campo => formatarValor(eleitor[campo as keyof Eleitor], campo))
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 32,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 32 },
    });

    doc.save(`eleitores_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  };

  const handleExportar = async () => {
    if (!currentGabinete) return;

    if (camposSelecionados.length === 0) {
      toast({
        title: 'Selecione ao menos um campo',
        description: 'É necessário selecionar pelo menos um campo para exportar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const eleitores = await buscarEleitores();

      if (eleitores.length === 0) {
        toast({
          title: 'Nenhum eleitor encontrado',
          description: 'Não há eleitores para exportar com os filtros aplicados.',
          variant: 'destructive',
        });
        return;
      }

      // Exportar de acordo com o formato selecionado
      switch (formato) {
        case 'csv':
          exportarCSV(eleitores);
          break;
        case 'xlsx':
          exportarXLSX(eleitores);
          break;
        case 'pdf':
          exportarPDF(eleitores);
          break;
      }

      // Registrar auditoria
      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'export_report',
        entityType: 'relatorio',
        details: {
          tipo: 'eleitores',
          formato,
          total_registros: eleitores.length,
          campos: camposSelecionados,
          filtros: {
            searchTerm,
            selectedBairro,
            selectedCidade,
            selectedTags,
            selectedAssessor,
          },
        },
      });

      toast({
        title: 'Dados exportados com sucesso!',
        description: `${eleitores.length} registro(s) exportado(s) em formato ${formato.toUpperCase()}.`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: 'Erro ao exportar dados',
        description: error.message || 'Ocorreu um erro ao exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Campos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos para Exportar</CardTitle>
          <CardDescription>
            Selecione quais informações deseja incluir na exportação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {camposDisponiveis.map(campo => (
              <div key={campo.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`campo-${campo.id}`}
                  checked={camposSelecionados.includes(campo.id)}
                  onCheckedChange={() => toggleCampo(campo.id)}
                  disabled={campo.obrigatorio}
                />
                <Label
                  htmlFor={`campo-${campo.id}`}
                  className={`cursor-pointer ${campo.obrigatorio ? 'font-semibold' : ''}`}
                >
                  {campo.label}
                  {campo.obrigatorio && <span className="text-xs text-muted-foreground ml-1">(obrigatório)</span>}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Formato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formato de Exportação</CardTitle>
          <CardDescription>
            Escolha o formato do arquivo que será gerado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={formato} onValueChange={(value: any) => setFormato(value)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="xlsx" id="formato-xlsx" />
                <Label htmlFor="formato-xlsx" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Excel (XLSX)</div>
                    <div className="text-xs text-muted-foreground">Ideal para análise de dados e planilhas</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="csv" id="formato-csv" />
                <Label htmlFor="formato-csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Table className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-muted-foreground">Compatível com diversos sistemas e bancos de dados</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="pdf" id="formato-pdf" />
                <Label htmlFor="formato-pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">PDF</div>
                    <div className="text-xs text-muted-foreground">Formato de documento para impressão e visualização</div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Resumo e Botão */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">Resumo da Exportação</p>
              <p className="text-muted-foreground">
                {camposSelecionados.length} campo(s) selecionado(s) • Formato: {formato.toUpperCase()}
              </p>
            </div>
            <Button onClick={handleExportar} disabled={loading || camposSelecionados.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar Dados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
