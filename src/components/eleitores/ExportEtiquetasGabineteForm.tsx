import { useState } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Printer, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import { logAudit } from '@/lib/auditLog';

interface ExportEtiquetasGabineteFormProps {
  onClose: () => void;
}

const modelosEtiquetas = {
  'pimaco-6182': {
    nome: 'PIMACO 6182/CARTA (14 etiquetas)',
    larguraMm: 101.6,
    alturaMm: 33.9,
    colunas: 2,
    linhas: 7,
    etiquetasPorFolha: 14,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 15.8,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
  },
  'pimaco-6081': {
    nome: 'PIMACO 6081/CARTA (20 etiquetas)',
    larguraMm: 101.6,
    alturaMm: 25.4,
    colunas: 2,
    linhas: 10,
    etiquetasPorFolha: 20,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 15.8,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
  },
  'pimaco-a4360': {
    nome: 'PIMACO A4360/A4 (21 etiquetas)',
    larguraMm: 63.5,
    alturaMm: 38.1,
    colunas: 3,
    linhas: 7,
    etiquetasPorFolha: 21,
    margemSuperiorMm: 16,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
  },
  'pimaco-carta-24': {
    nome: 'PIMACO (24 etiquetas)',
    larguraMm: 63.5,
    alturaMm: 33.9,
    colunas: 3,
    linhas: 8,
    etiquetasPorFolha: 24,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 4.76,
    espacamentoHorizontalMm: 2.54,
    espacamentoVerticalMm: 0,
  },
  'pimaco-6180': {
    nome: 'PIMACO 6180/CARTA (30 etiquetas)',
    larguraMm: 66.7,
    alturaMm: 25.4,
    colunas: 3,
    linhas: 10,
    etiquetasPorFolha: 30,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 6.35,
    espacamentoHorizontalMm: 2.54,
    espacamentoVerticalMm: 0,
  },
  'pimaco-a4256': {
    nome: 'PIMACO A4256/A4 (33 etiquetas)',
    larguraMm: 63.5,
    alturaMm: 25.4,
    colunas: 3,
    linhas: 11,
    etiquetasPorFolha: 33,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
  },
  'pimaco-a4375': {
    nome: 'Pimaco A4375 (18 etiquetas)',
    larguraMm: 104.5,
    alturaMm: 32.83,
    colunas: 2,
    linhas: 9,
    etiquetasPorFolha: 18,
    margemSuperiorMm: 16,
    margemEsquerdaMm: 7.5,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
  },
  'rs-brasil-16': {
    nome: 'RS Brasil 16 (16 etiquetas)',
    larguraMm: 99,
    alturaMm: 34,
    colunas: 2,
    linhas: 8,
    etiquetasPorFolha: 16,
    margemSuperiorMm: 12.7,
    margemEsquerdaMm: 6.35,
    espacamentoHorizontalMm: 3.2,
    espacamentoVerticalMm: 0,
  },
};

export function ExportEtiquetasGabineteForm({ onClose }: ExportEtiquetasGabineteFormProps) {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modelo, setModelo] = useState<keyof typeof modelosEtiquetas>('pimaco-6182');
  const [quantidade, setQuantidade] = useState<string>('50');
  const [gabineteData, setGabineteData] = useState<any>(null);
  const [verificandoDados, setVerificandoDados] = useState(false);

  // Buscar dados completos do gabinete ao carregar
  useState(() => {
    const buscarGabinete = async () => {
      if (!currentGabinete) return;
      
      setVerificandoDados(true);
      try {
        const { data, error } = await supabase
          .from('gabinetes')
          .select('*')
          .eq('id', currentGabinete.gabinete_id)
          .single();

        if (error) throw error;
        setGabineteData(data);
      } catch (error: any) {
        console.error('Erro ao buscar dados do gabinete:', error);
      } finally {
        setVerificandoDados(false);
      }
    };

    buscarGabinete();
  });

  const modeloSelecionado = modelosEtiquetas[modelo];
  const qtdNum = parseInt(quantidade) || 0;
  const folhasNecessarias = Math.ceil(qtdNum / modeloSelecionado.etiquetasPorFolha);

  const enderecoCompleto = gabineteData && (
    gabineteData.endereco_completo || 
    gabineteData.bairro || 
    gabineteData.cidade || 
    gabineteData.estado || 
    gabineteData.cep
  );

  const gerarEtiquetas = () => {
    if (!gabineteData) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const { 
      larguraMm, 
      alturaMm, 
      margemEsquerdaMm, 
      margemSuperiorMm, 
      espacamentoHorizontalMm, 
      espacamentoVerticalMm,
      colunas,
      linhas,
      etiquetasPorFolha
    } = modeloSelecionado;

    let etiquetasGeradas = 0;
    let paginaAtual = 0;

    while (etiquetasGeradas < qtdNum) {
      if (paginaAtual > 0) {
        doc.addPage();
      }

      for (let linha = 0; linha < linhas && etiquetasGeradas < qtdNum; linha++) {
        for (let coluna = 0; coluna < colunas && etiquetasGeradas < qtdNum; coluna++) {
          const x = margemEsquerdaMm + coluna * (larguraMm + espacamentoHorizontalMm);
          const y = margemSuperiorMm + linha * (alturaMm + espacamentoVerticalMm);

          // Desenhar borda da etiqueta (opcional, para visualização)
          // doc.rect(x, y, larguraMm, alturaMm);

          // Nome do gabinete
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const nomeGabinete = gabineteData.nome || '';
          doc.text(nomeGabinete, x + 2, y + 5, { maxWidth: larguraMm - 4 });

          // Endereço
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          let yOffset = 10;

          if (gabineteData.endereco_completo) {
            const endereco = `${gabineteData.endereco_completo}${gabineteData.numero ? ', ' + gabineteData.numero : ''}`;
            doc.text(endereco, x + 2, y + yOffset, { maxWidth: larguraMm - 4 });
            yOffset += 5;
          }

          if (gabineteData.bairro) {
            doc.text(gabineteData.bairro, x + 2, y + yOffset, { maxWidth: larguraMm - 4 });
            yOffset += 5;
          }

          if (gabineteData.cidade && gabineteData.estado) {
            doc.text(`${gabineteData.cidade} - ${gabineteData.estado}`, x + 2, y + yOffset, { maxWidth: larguraMm - 4 });
            yOffset += 5;
          } else if (gabineteData.cidade) {
            doc.text(gabineteData.cidade, x + 2, y + yOffset, { maxWidth: larguraMm - 4 });
            yOffset += 5;
          }

          if (gabineteData.cep) {
            doc.text(`CEP: ${gabineteData.cep}`, x + 2, y + yOffset, { maxWidth: larguraMm - 4 });
          }

          etiquetasGeradas++;
        }
      }

      paginaAtual++;
    }

    doc.save(`etiquetas_gabinete_${new Date().getTime()}.pdf`);
  };

  const handleGerar = async () => {
    if (!currentGabinete || !gabineteData) return;

    if (qtdNum <= 0 || qtdNum > 10000) {
      toast({
        title: 'Quantidade inválida',
        description: 'Informe uma quantidade entre 1 e 10.000 etiquetas.',
        variant: 'destructive',
      });
      return;
    }

    if (!enderecoCompleto) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha o endereço do gabinete nas configurações antes de gerar as etiquetas.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      gerarEtiquetas();

      // Registrar auditoria
      await logAudit({
        gabineteId: currentGabinete.gabinete_id,
        action: 'export_report',
        entityType: 'relatorio',
        details: {
          tipo: 'etiquetas_gabinete',
          modelo,
          quantidade: qtdNum,
          folhas: folhasNecessarias,
        },
      });

      toast({
        title: 'Etiquetas geradas com sucesso!',
        description: `${qtdNum} etiqueta(s) em ${folhasNecessarias} folha(s).`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar etiquetas:', error);
      toast({
        title: 'Erro ao gerar etiquetas',
        description: error.message || 'Ocorreu um erro ao gerar as etiquetas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificandoDados) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!enderecoCompleto && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O endereço do gabinete não está completo. Por favor, preencha as informações de endereço em <strong>Configurações → Informações do Gabinete</strong> antes de gerar as etiquetas.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview dos dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados que serão impressos</CardTitle>
          <CardDescription>
            Preview do conteúdo das etiquetas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="font-semibold">{gabineteData?.nome || 'Nome do Gabinete'}</p>
            {gabineteData?.endereco_completo && (
              <p className="text-sm">{gabineteData.endereco_completo}{gabineteData.numero ? ', ' + gabineteData.numero : ''}</p>
            )}
            {gabineteData?.bairro && <p className="text-sm">{gabineteData.bairro}</p>}
            {gabineteData?.cidade && gabineteData?.estado && (
              <p className="text-sm">{gabineteData.cidade} - {gabineteData.estado}</p>
            )}
            {gabineteData?.cep && <p className="text-sm">CEP: {gabineteData.cep}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Quantidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quantidade de Etiquetas</CardTitle>
          <CardDescription>
            Quantas etiquetas você precisa gerar?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="quantidade">Número de etiquetas</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              max="10000"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 50"
            />
            {qtdNum > 0 && (
              <p className="text-sm text-muted-foreground">
                Serão geradas {folhasNecessarias} folha(s) com {modeloSelecionado.etiquetasPorFolha} etiqueta(s) por folha
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modelo de Etiqueta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modelo de Etiqueta</CardTitle>
          <CardDescription>
            Selecione o modelo compatível com sua folha de etiquetas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={modelo} onValueChange={(value: any) => setModelo(value)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(modelosEtiquetas).map(([id, modeloInfo]) => {
                // Escala reduzida para garantir que tudo caiba
                const escala = 0.28;
                const a4LarguraMm = 210;
                const a4AlturaMm = 297;
                
                return (
                  <div
                    key={id}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                      modelo === id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                    onClick={() => setModelo(id as keyof typeof modelosEtiquetas)}
                  >
                    <RadioGroupItem value={id} id={`modelo-${id}`} className="sr-only" />
                    
                    {/* Título do modelo */}
                    <div className="p-3 border-b bg-muted/50">
                      <Label htmlFor={`modelo-${id}`} className="font-medium text-sm cursor-pointer">
                        {modeloInfo.nome}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {modeloInfo.larguraMm}mm × {modeloInfo.alturaMm}mm
                      </p>
                    </div>

                    {/* Preview da folha A4 */}
                    <div className="p-4 bg-gray-50 flex items-center justify-center">
                      <div
                        className="bg-white shadow-sm relative"
                        style={{
                          width: `${a4LarguraMm * escala}px`,
                          height: `${a4AlturaMm * escala}px`,
                        }}
                      >
                        {/* Renderizar etiquetas nas posições exatas centralizadas */}
                        {Array.from({ length: modeloInfo.linhas }).map((_, linha) =>
                          Array.from({ length: modeloInfo.colunas }).map((_, coluna) => {
                            const index = linha * modeloInfo.colunas + coluna;
                            if (index >= modeloInfo.etiquetasPorFolha) return null;

                            // Calcular largura total ocupada pelas etiquetas
                            const larguraTotalEtiquetas = modeloInfo.colunas * modeloInfo.larguraMm + (modeloInfo.colunas - 1) * modeloInfo.espacamentoHorizontalMm;
                            const alturaTotalEtiquetas = modeloInfo.linhas * modeloInfo.alturaMm + (modeloInfo.linhas - 1) * modeloInfo.espacamentoVerticalMm;
                            
                            // Centralizar
                            const offsetX = (a4LarguraMm - larguraTotalEtiquetas) / 2;
                            const offsetY = (a4AlturaMm - alturaTotalEtiquetas) / 2;

                            const x = offsetX + coluna * (modeloInfo.larguraMm + modeloInfo.espacamentoHorizontalMm);
                            const y = offsetY + linha * (modeloInfo.alturaMm + modeloInfo.espacamentoVerticalMm);

                            return (
                              <div
                                key={`${linha}-${coluna}`}
                                className="absolute border border-gray-300 bg-white"
                                style={{
                                  left: `${x * escala}px`,
                                  top: `${y * escala}px`,
                                  width: `${modeloInfo.larguraMm * escala}px`,
                                  height: `${modeloInfo.alturaMm * escala}px`,
                                  borderRadius: '1px',
                                }}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Info adicional */}
                    <div className="p-2 bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground">
                        {modeloInfo.etiquetasPorFolha} etiquetas/folha
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Botão de Gerar */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">Resumo</p>
              <p className="text-muted-foreground">
                {qtdNum} etiqueta(s) • {folhasNecessarias} folha(s) • {modeloSelecionado.nome}
              </p>
            </div>
            <Button 
              onClick={handleGerar} 
              disabled={loading || !enderecoCompleto || qtdNum <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar Etiquetas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
