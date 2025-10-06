import { useState } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Printer, Users, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { logAudit } from '@/lib/auditLog';
import { ExportEtiquetasGabineteForm } from './ExportEtiquetasGabineteForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExportEtiquetasFormProps {
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
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_nascimento: string | null;
  telefone: string | null;
}

const modelosEtiquetas = [
  {
    id: 'pimaco-6182',
    nome: 'PIMACO 6182/CARTA',
    etiquetasPorFolha: 14,
    colunas: 2,
    linhas: 7,
    larguraMm: 101.6,
    alturaMm: 33.9,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 15.8,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
    observacao: '14 etiquetas por folha',
  },
  {
    id: 'pimaco-6081',
    nome: 'PIMACO 6081/CARTA',
    etiquetasPorFolha: 20,
    colunas: 2,
    linhas: 10,
    larguraMm: 101.6,
    alturaMm: 25.4,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 15.8,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
    observacao: '20 etiquetas por folha',
  },
  {
    id: 'pimaco-a4360',
    nome: 'PIMACO A4360/A4',
    etiquetasPorFolha: 21,
    colunas: 3,
    linhas: 7,
    larguraMm: 63.5,
    alturaMm: 38.1,
    margemSuperiorMm: 16,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
    observacao: '21 etiquetas por folha',
  },
  {
    id: 'pimaco-carta-24',
    nome: 'PIMACO',
    etiquetasPorFolha: 24,
    colunas: 3,
    linhas: 8,
    larguraMm: 63.5,
    alturaMm: 33.9,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 4.76,
    espacamentoHorizontalMm: 2.54,
    espacamentoVerticalMm: 0,
    observacao: 'Imprimir sem margens!',
  },
  {
    id: 'pimaco-6180',
    nome: 'PIMACO 6180/CARTA',
    etiquetasPorFolha: 30,
    colunas: 3,
    linhas: 10,
    larguraMm: 66.7,
    alturaMm: 25.4,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 6.35,
    espacamentoHorizontalMm: 2.54,
    espacamentoVerticalMm: 0,
    observacao: '30 etiquetas por folha',
  },
  {
    id: 'pimaco-a4256',
    nome: 'PIMACO A4256/A4',
    etiquetasPorFolha: 33,
    colunas: 3,
    linhas: 11,
    larguraMm: 63.5,
    alturaMm: 25.4,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
    observacao: '33 etiquetas por folha',
  },
  {
    id: 'pimaco-a4375',
    nome: 'Pimaco A4375',
    etiquetasPorFolha: 18,
    colunas: 2,
    linhas: 9,
    larguraMm: 104.5,
    alturaMm: 32.83,
    margemSuperiorMm: 16,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
    observacao: '18 etiquetas por folha',
  },
  {
    id: 'rs-brasil-16',
    nome: 'RS Brasil 16',
    etiquetasPorFolha: 16,
    colunas: 2,
    linhas: 8,
    larguraMm: 99,
    alturaMm: 34,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 6.35,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
    observacao: '16 etiquetas por folha',
  },
];

export function ExportEtiquetasForm({
  searchTerm,
  selectedBairro,
  selectedCidade,
  selectedTags,
  selectedAssessor,
  onClose,
}: ExportEtiquetasFormProps) {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Opções de conteúdo
  const [incluirNome, setIncluirNome] = useState(true);
  const [incluirDataNascimento, setIncluirDataNascimento] = useState(false);
  const [incluirTratamento, setIncluirTratamento] = useState(true);
  const [incluirAC, setIncluirAC] = useState(false);
  const [incluirTelefone, setIncluirTelefone] = useState(false);
  const [deduplicacao, setDeduplicacao] = useState<'eleitor' | 'residencia'>('eleitor');
  const [ordenarPor, setOrdenarPor] = useState<'nome' | 'bairro' | 'cidade' | 'cep'>('nome');
  
  // Modelo selecionado
  const [modeloSelecionado, setModeloSelecionado] = useState('pimaco-6180');

  const fetchEleitores = async (): Promise<Eleitor[]> => {
    if (!currentGabinete) return [];

    let query = supabase
      .from('eleitores')
      .select('id, nome_completo, endereco, numero, bairro, cidade, estado, cep, data_nascimento, telefone')
      .eq('gabinete_id', currentGabinete.gabinete_id)
      .is('deleted_at', null);

    if (searchTerm.trim()) {
      query = query.or(`nome_completo.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%`);
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

    // Ordenar
    const orderMap = {
      nome: 'nome_completo',
      bairro: 'bairro',
      cidade: 'cidade',
      cep: 'cep',
    };
    query = query.order(orderMap[ordenarPor], { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  };

  const deduplicarEleitores = (eleitores: Eleitor[]): Eleitor[] => {
    if (deduplicacao === 'eleitor') {
      return eleitores;
    }

    // Deduplicar por residência (endereço + número)
    const residenciasUnicas = new Map<string, Eleitor>();
    
    eleitores.forEach((eleitor) => {
      const chave = `${eleitor.endereco || ''}-${eleitor.numero || ''}-${eleitor.bairro || ''}-${eleitor.cidade || ''}`.toLowerCase();
      if (!residenciasUnicas.has(chave)) {
        residenciasUnicas.set(chave, eleitor);
      }
    });

    return Array.from(residenciasUnicas.values());
  };

  const getTratamento = (nome: string): string => {
    if (!incluirTratamento) return '';
    
    // Lógica simples de tratamento
    const primeiroNome = nome.split(' ')[0].toLowerCase();
    const nomesComuns = ['maria', 'ana', 'julia', 'beatriz', 'laura', 'gabriela', 'fernanda'];
    
    if (nomesComuns.some(n => primeiroNome.includes(n))) {
      return 'Sra.';
    }
    
    return 'Sr.';
  };

  const formatarEndereco = (eleitor: Eleitor): string[] => {
    const linhas: string[] = [];

    // Linha 1: Nome
    if (incluirNome) {
      const tratamento = getTratamento(eleitor.nome_completo);
      const ac = incluirAC ? 'A/C ' : '';
      linhas.push(`${ac}${tratamento} ${eleitor.nome_completo}`);
    }

    // Linha 2: Endereço
    let enderecoLinha = '';
    if (eleitor.endereco) {
      enderecoLinha = eleitor.endereco;
      if (eleitor.numero) {
        enderecoLinha += `, ${eleitor.numero}`;
      }
      if (eleitor.bairro) {
        enderecoLinha += ` – ${eleitor.bairro}`;
      }
    }
    if (enderecoLinha) {
      linhas.push(enderecoLinha);
    }

    // Linha 3: Cidade/Estado - CEP
    let cidadeEstadoCep = '';
    if (eleitor.cidade) {
      cidadeEstadoCep = eleitor.cidade;
      if (eleitor.estado) {
        cidadeEstadoCep += `/${eleitor.estado}`;
      }
    }
    if (eleitor.cep) {
      if (cidadeEstadoCep) {
        cidadeEstadoCep += ` – CEP ${eleitor.cep}`;
      } else {
        cidadeEstadoCep = `CEP ${eleitor.cep}`;
      }
    }
    if (cidadeEstadoCep) {
      linhas.push(cidadeEstadoCep);
    }

    // Linhas opcionais
    if (incluirDataNascimento && eleitor.data_nascimento) {
      const data = new Date(eleitor.data_nascimento);
      linhas.push(`Nascimento: ${data.toLocaleDateString('pt-BR')}`);
    }

    if (incluirTelefone && eleitor.telefone) {
      linhas.push(`Tel: ${eleitor.telefone}`);
    }

    return linhas;
  };

  const mmToPt = (mm: number): number => mm * 2.834645669;

  const gerarPDF = async () => {
    setLoading(true);

    try {
      const eleitores = await fetchEleitores();
      
      if (eleitores.length === 0) {
        toast({
          title: 'Nenhum eleitor encontrado',
          description: 'Não há eleitores com os filtros aplicados.',
          variant: 'destructive',
        });
        return;
      }

      const eleitoresDeduplciados = deduplicarEleitores(eleitores);

      const modelo = modelosEtiquetas.find((m) => m.id === modeloSelecionado);
      if (!modelo) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const larguraPt = mmToPt(modelo.larguraMm);
      const alturaPt = mmToPt(modelo.alturaMm);
      const margemSuperiorPt = mmToPt(modelo.margemSuperiorMm);
      const margemEsquerdaPt = mmToPt(modelo.margemEsquerdaMm);
      const espacamentoHorizontalPt = mmToPt(modelo.espacamentoHorizontalMm);
      const espacamentoVerticalPt = mmToPt(modelo.espacamentoVerticalMm);

      let indiceEleitor = 0;
      let numeroPagina = 0;

      while (indiceEleitor < eleitoresDeduplciados.length) {
        if (numeroPagina > 0) {
          pdf.addPage();
        }
        numeroPagina++;

        // Desenhar etiquetas na página
        for (let linha = 0; linha < modelo.linhas; linha++) {
          for (let coluna = 0; coluna < modelo.colunas; coluna++) {
            if (indiceEleitor >= eleitoresDeduplciados.length) break;

            const eleitor = eleitoresDeduplciados[indiceEleitor];
            const linhasTexto = formatarEndereco(eleitor);

            const x = margemEsquerdaPt + coluna * (larguraPt + espacamentoHorizontalPt);
            const y = margemSuperiorPt + linha * (alturaPt + espacamentoVerticalPt);

            // Desenhar bordas (opcional, para debug)
            // pdf.setDrawColor(200, 200, 200);
            // pdf.rect(x, y, larguraPt, alturaPt);

            // Desenhar texto
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');

            const padding = 5;
            let yTexto = y + padding + 10;

            linhasTexto.forEach((linha, idx) => {
              if (idx === 0 && incluirNome) {
                pdf.setFont('helvetica', 'bold');
              } else {
                pdf.setFont('helvetica', 'normal');
              }

              // Quebrar linha se texto for muito longo
              const linhasQuebradas = pdf.splitTextToSize(linha, larguraPt - padding * 2);
              linhasQuebradas.forEach((linhaQuebrada: string) => {
                if (yTexto < y + alturaPt - padding) {
                  pdf.text(linhaQuebrada, x + padding, yTexto);
                  yTexto += 12;
                }
              });
            });

            indiceEleitor++;
          }
        }
      }

      // Salvar PDF
      pdf.save(`etiquetas-${new Date().getTime()}.pdf`);

      // Log de auditoria
      if (currentGabinete) {
        await logAudit({
          gabineteId: currentGabinete.gabinete_id,
          action: 'export_report',
          entityType: 'eleitor',
          details: {
            tipo: 'etiquetas',
            modelo: modelo.nome,
            quantidade: eleitoresDeduplciados.length,
            filtros: {
              bairro: selectedBairro || null,
              cidade: selectedCidade || null,
              tags: selectedTags.length > 0 ? selectedTags : null,
              assessor: selectedAssessor || null,
            },
          },
        });
      }

      toast({
        title: 'Etiquetas geradas com sucesso!',
        description: `${eleitoresDeduplciados.length} etiqueta(s) no formato ${modelo.nome}`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar etiquetas:', error);
      toast({
        title: 'Erro ao gerar etiquetas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const modeloAtual = modelosEtiquetas.find((m) => m.id === modeloSelecionado);

  return (
    <Tabs defaultValue="eleitores" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="eleitores" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Dados dos Eleitores
        </TabsTrigger>
        <TabsTrigger value="gabinete" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Dados do Gabinete
        </TabsTrigger>
      </TabsList>

      <TabsContent value="eleitores">
        <div className="space-y-6">
      {/* Opções de Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opções de Conteúdo</CardTitle>
          <CardDescription>
            Personalize as informações que deseja incluir nas etiquetas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-nome"
                checked={incluirNome}
                onCheckedChange={(checked) => setIncluirNome(checked as boolean)}
              />
              <Label htmlFor="incluir-nome" className="cursor-pointer">
                Incluir nome do eleitor
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-data-nascimento"
                checked={incluirDataNascimento}
                onCheckedChange={(checked) => setIncluirDataNascimento(checked as boolean)}
              />
              <Label htmlFor="incluir-data-nascimento" className="cursor-pointer">
                Incluir data de nascimento
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-tratamento"
                checked={incluirTratamento}
                onCheckedChange={(checked) => setIncluirTratamento(checked as boolean)}
              />
              <Label htmlFor="incluir-tratamento" className="cursor-pointer">
                Incluir tratamento (Sr./Sra.)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-ac"
                checked={incluirAC}
                onCheckedChange={(checked) => setIncluirAC(checked as boolean)}
              />
              <Label htmlFor="incluir-ac" className="cursor-pointer">
                Incluir A/C (Aos Cuidados de)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluir-telefone"
                checked={incluirTelefone}
                onCheckedChange={(checked) => setIncluirTelefone(checked as boolean)}
              />
              <Label htmlFor="incluir-telefone" className="cursor-pointer">
                Incluir telefone
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Deduplicação</Label>
              <RadioGroup value={deduplicacao} onValueChange={(value) => setDeduplicacao(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eleitor" id="dup-eleitor" />
                  <Label htmlFor="dup-eleitor" className="cursor-pointer">
                    1 etiqueta por eleitor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="residencia" id="dup-residencia" />
                  <Label htmlFor="dup-residencia" className="cursor-pointer">
                    1 etiqueta por residência
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select value={ordenarPor} onValueChange={(value) => setOrdenarPor(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="bairro">Bairro</SelectItem>
                  <SelectItem value="cidade">Cidade</SelectItem>
                  <SelectItem value="cep">CEP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modelos de Etiquetas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modelo de Etiqueta</CardTitle>
          <CardDescription>
            Selecione o modelo compatível com sua folha de etiquetas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={modeloSelecionado} onValueChange={setModeloSelecionado}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelosEtiquetas.map((modelo) => {
                // Escala reduzida para garantir que tudo caiba
                const escala = 0.28;
                const a4LarguraMm = 210;
                const a4AlturaMm = 297;
                
                return (
                  <div
                    key={modelo.id}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                      modeloSelecionado === modelo.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                    onClick={() => setModeloSelecionado(modelo.id)}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={modelo.id} id={modelo.id} />
                        <Label htmlFor={modelo.id} className="cursor-pointer font-semibold text-sm">
                          {modelo.nome}
                        </Label>
                      </div>
                      
                      {/* Preview limpo da folha A4 */}
                      <div className="bg-gray-100 rounded p-3 flex items-center justify-center">
                        <div
                          className="relative bg-white shadow-md"
                          style={{
                            width: `${a4LarguraMm * escala}px`,
                            height: `${a4AlturaMm * escala}px`,
                          }}
                        >
                          {/* Renderizar etiquetas nas posições exatas centralizadas */}
                          {Array.from({ length: modelo.linhas }).map((_, linha) =>
                            Array.from({ length: modelo.colunas }).map((_, coluna) => {
                              const index = linha * modelo.colunas + coluna;
                              if (index >= modelo.etiquetasPorFolha) return null;

                              // Calcular largura total ocupada pelas etiquetas
                              const larguraTotalEtiquetas = modelo.colunas * modelo.larguraMm + (modelo.colunas - 1) * modelo.espacamentoHorizontalMm;
                              const alturaTotalEtiquetas = modelo.linhas * modelo.alturaMm + (modelo.linhas - 1) * modelo.espacamentoVerticalMm;
                              
                              // Centralizar
                              const offsetX = (a4LarguraMm - larguraTotalEtiquetas) / 2;
                              const offsetY = (a4AlturaMm - alturaTotalEtiquetas) / 2;

                              const x = offsetX + coluna * (modelo.larguraMm + modelo.espacamentoHorizontalMm);
                              const y = offsetY + linha * (modelo.alturaMm + modelo.espacamentoVerticalMm);

                              return (
                                <div
                                  key={`${linha}-${coluna}`}
                                  className="absolute border border-gray-300 bg-white"
                                  style={{
                                    left: `${x * escala}px`,
                                    top: `${y * escala}px`,
                                    width: `${modelo.larguraMm * escala}px`,
                                    height: `${modelo.alturaMm * escala}px`,
                                    borderRadius: '1px',
                                  }}
                                />
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">
                          {modelo.etiquetasPorFolha} etiquetas por folha
                        </p>
                        <p className="text-muted-foreground">
                          {modelo.larguraMm}mm x {modelo.alturaMm}mm
                        </p>
                        {modelo.observacao && (
                          <p className="text-xs text-primary font-medium">{modelo.observacao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Preview e Geração */}
      {modeloAtual && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo da Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Modelo:</span>
                <p className="font-medium">{modeloAtual.nome}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Etiquetas por folha:</span>
                <p className="font-medium">{modeloAtual.etiquetasPorFolha}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deduplicação:</span>
                <p className="font-medium">
                  {deduplicacao === 'eleitor' ? 'Por eleitor' : 'Por residência'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ordenação:</span>
                <p className="font-medium capitalize">{ordenarPor}</p>
              </div>
            </div>

            <Button onClick={gerarPDF} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar PDF de Etiquetas
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  </TabsContent>

  <TabsContent value="gabinete">
    <ExportEtiquetasGabineteForm onClose={onClose} />
  </TabsContent>
</Tabs>
  );
}
