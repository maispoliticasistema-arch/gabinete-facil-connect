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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, Eye, Plus } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Blocks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lista de Blocos</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloco
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
          <ScrollArea className="h-[calc(100vh-300px)]">
            {blocks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhum bloco adicionado ainda
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique em "Adicionar Bloco" para começar a construir seu portal
                </p>
              </div>
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Block Editor */}
      <div>
        {selectedBlock ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="default">
                Editando: {blockTypeLabels[selectedBlock.type]}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBlock(null)}
              >
                Fechar Editor
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <BlockEditor block={selectedBlock} onChange={updateBlock} />
            </ScrollArea>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione um bloco para editar
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique em "Editar" em qualquer bloco da lista ao lado
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
