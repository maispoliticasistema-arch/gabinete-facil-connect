import { useState } from 'react';
import { FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportEtiquetasForm } from './ExportEtiquetasForm';

interface ExportEleitoresDialogProps {
  searchTerm: string;
  selectedBairro: string;
  selectedCidade: string;
  selectedTags: string[];
  selectedAssessor: string;
}

export function ExportEleitoresDialog({
  searchTerm,
  selectedBairro,
  selectedCidade,
  selectedTags,
  selectedAssessor,
}: ExportEleitoresDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Escolha o formato de exportação desejado
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="etiquetas" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="etiquetas">Etiquetas de Correspondência</TabsTrigger>
          </TabsList>
          
          <TabsContent value="etiquetas" className="space-y-4 mt-4">
            <ExportEtiquetasForm
              searchTerm={searchTerm}
              selectedBairro={selectedBairro}
              selectedCidade={selectedCidade}
              selectedTags={selectedTags}
              selectedAssessor={selectedAssessor}
              onClose={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
