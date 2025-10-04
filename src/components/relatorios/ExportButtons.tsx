import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Image } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  onExportXLSX: () => void;
  onExportPDF: () => void;
}

export function ExportButtons({ onExportXLSX, onExportPDF }: ExportButtonsProps) {
  const handleExportXLSX = () => {
    toast.info("Gerando planilha...");
    onExportXLSX();
  };

  const handleExportPDF = () => {
    toast.info("Gerando PDF...");
    onExportPDF();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportações</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={handleExportXLSX} variant="outline" className="flex-1 min-w-[150px]">
          <Download className="mr-2 h-4 w-4" />
          Exportar XLSX
        </Button>
        <Button onClick={handleExportPDF} variant="outline" className="flex-1 min-w-[150px]">
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" className="flex-1 min-w-[150px]">
          <Image className="mr-2 h-4 w-4" />
          Gráficos em Imagem
        </Button>
      </CardContent>
    </Card>
  );
}