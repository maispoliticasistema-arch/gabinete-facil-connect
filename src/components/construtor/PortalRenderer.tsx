import { Block } from './BlockTypes';
import { BlockPreview } from './BlockPreview';
import { FormularioPortal } from './FormularioPortal';

interface PortalRendererProps {
  blocks: Block[];
  colors: { primary: string; secondary: string };
  titulo?: string;
  gabineteId: string;
}

export function PortalRenderer({ blocks, colors, titulo, gabineteId }: PortalRendererProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO */}
      {titulo && (
        <head>
          <title>{titulo}</title>
        </head>
      )}
      
      {/* Render all blocks */}
      {blocks.map((block) => {
        // Use FormularioPortal for form blocks
        if (block.type === 'forms') {
          return (
            <FormularioPortal
              key={block.id}
              block={block}
              gabineteId={gabineteId}
              colors={colors}
            />
          );
        }
        
        // Use BlockPreview for all other blocks
        return <BlockPreview key={block.id} block={block} colors={colors} />;
      })}
      
      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold" style={{ color: colors.primary }}>
              Portal em Construção
            </h1>
            <p className="text-muted-foreground">
              Este portal está sendo configurado. Volte em breve!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
