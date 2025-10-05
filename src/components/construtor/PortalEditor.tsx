import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockType, blockTypeLabels, blockTypeDescriptions, getDefaultBlockData } from './BlockTypes';
import { BlockEditor } from './BlockEditor';
import { BlockPreview } from './BlockPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PortalEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  colors: { primary: string; secondary: string };
}

function SortableBlock({
  block,
  onEdit,
  onDelete,
}: {
  block: Block;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <p className="font-semibold">{blockTypeLabels[block.type]}</p>
                <p className="text-xs text-muted-foreground">{blockTypeDescriptions[block.type]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PortalEditor({ blocks, onChange, colors }: PortalEditorProps) {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [newBlockType, setNewBlockType] = useState<BlockType>('hero');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      data: getDefaultBlockData(type),
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (updatedBlock: Block) => {
    onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
    setSelectedBlock(updatedBlock);
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
    if (selectedBlock?.id === id) {
      setSelectedBlock(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Blocos</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Bloco</DialogTitle>
                    <DialogDescription>
                      Escolha o tipo de bloco que deseja adicionar ao portal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    <Select value={newBlockType} onValueChange={(v) => setNewBlockType(v as BlockType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(blockTypeLabels).map(([type, label]) => (
                          <SelectItem key={type} value={type}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {blockTypeDescriptions[newBlockType]}
                    </p>
                    <Button className="w-full" onClick={() => addBlock(newBlockType)}>
                      Adicionar Bloco
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum bloco adicionado. Clique em "Adicionar" para começar.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onEdit={() => setSelectedBlock(block)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {selectedBlock && (
          <BlockEditor block={selectedBlock} onChange={updateBlock} />
        )}
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-2">
        <Card className="sticky top-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Preview em Tempo Real</CardTitle>
                {!showPreview && <Badge variant="secondary">Oculto</Badge>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent className="p-0">
              <div className="border-t border-border">
                <div className="bg-muted/30 p-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Preview - as alterações aparecem em tempo real
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="bg-background">
                  {blocks.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <p>Adicione blocos para ver o preview</p>
                    </div>
                  ) : (
                    blocks.map((block) => (
                      <BlockPreview key={block.id} block={block} colors={colors} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
