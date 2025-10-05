import { Block } from './BlockTypes';
import { BlockPreview } from './BlockPreview';

interface PortalRendererProps {
  blocks: Block[];
  colors: { primary: string; secondary: string };
  titulo?: string;
}

export function PortalRenderer({ blocks, colors, titulo }: PortalRendererProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO */}
      {titulo && (
        <head>
          <title>{titulo}</title>
        </head>
      )}
      
      {/* Render all blocks */}
      {blocks.map((block) => (
        <BlockPreview key={block.id} block={block} colors={colors} />
      ))}
      
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
