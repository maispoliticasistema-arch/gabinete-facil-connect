import { Block } from './BlockTypes';
import { BlockPreview } from './BlockPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';

interface PortalPreviewProps {
  blocks: Block[];
  colors: { primary: string; secondary: string };
}

export function PortalPreview({ blocks, colors }: PortalPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Preview do Portal</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualização de como seu portal ficará para o público
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
          <div className="bg-muted/30 p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            As alterações aparecem em tempo real conforme você edita
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="bg-background">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground p-8">
                <Eye className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">Nenhum bloco adicionado</p>
                <p className="text-sm text-center">
                  Adicione blocos na aba "Editor" para ver o preview do seu portal aqui
                </p>
              </div>
            ) : (
              blocks.map((block) => (
                <BlockPreview key={block.id} block={block} colors={colors} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
