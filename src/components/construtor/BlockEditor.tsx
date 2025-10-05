import { Block, BlockType } from './BlockTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Palette, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const updateData = (key: string, value: any) => {
    onChange({
      ...block,
      data: { ...block.data, [key]: value },
    });
  };

  const handleImageUpload = async (file: File, fieldKey: string) => {
    try {
      setUploadingImage(fieldKey);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('portal-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-images')
        .getPublicUrl(filePath);

      updateData(fieldKey, publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleArrayImageUpload = async (file: File, arrayKey: string, index: number, itemKey: string) => {
    try {
      setUploadingImage(`${arrayKey}-${index}-${itemKey}`);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-images')
        .getPublicUrl(filePath);

      const array = [...(block.data[arrayKey] || [])];
      array[index] = { ...array[index], [itemKey]: publicUrl };
      updateData(arrayKey, array);
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(null);
    }
  };

  const updateStyle = (key: string, value: any) => {
    onChange({
      ...block,
      styles: { ...block.styles, [key]: value },
    });
  };

  const updateArrayItem = (arrayKey: string, index: number, value: any) => {
    const array = [...(block.data[arrayKey] || [])];
    array[index] = value;
    updateData(arrayKey, array);
  };

  const addArrayItem = (arrayKey: string, defaultValue: any) => {
    const array = [...(block.data[arrayKey] || []), defaultValue];
    updateData(arrayKey, array);
  };

  const removeArrayItem = (arrayKey: string, index: number) => {
    const array = [...(block.data[arrayKey] || [])];
    array.splice(index, 1);
    updateData(arrayKey, array);
  };

  const renderEditor = () => {
    return (
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="styles">
            <Palette className="h-4 w-4 mr-2" />
            Estilos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          {renderContentEditor()}
        </TabsContent>

        <TabsContent value="styles" className="space-y-4 mt-4">
          {renderStylesEditor()}
        </TabsContent>
      </Tabs>
    );
  };

  const renderStylesEditor = () => {
    const styles = block.styles || {};
    
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Cores do Bloco</Label>
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.textColor || '#000000'}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={styles.textColor || '#000000'}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Cor do Título</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.titleColor || '#000000'}
                  onChange={(e) => updateStyle('titleColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={styles.titleColor || '#000000'}
                  onChange={(e) => updateStyle('titleColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            {(block.type === 'hero' || block.type === 'contact') && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Cor do Botão</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.buttonColor || '#6366f1'}
                      onChange={(e) => updateStyle('buttonColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={styles.buttonColor || '#6366f1'}
                      onChange={(e) => updateStyle('buttonColor', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Cor do Texto do Botão</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.buttonTextColor || '#ffffff'}
                      onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={styles.buttonTextColor || '#ffffff'}
                      onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Cor Hover do Botão</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={styles.buttonHoverColor || '#4f46e5'}
                      onChange={(e) => updateStyle('buttonHoverColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={styles.buttonHoverColor || '#4f46e5'}
                      onChange={(e) => updateStyle('buttonHoverColor', e.target.value)}
                      placeholder="#4f46e5"
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}

            {block.type !== 'hero' && block.type !== 'footer' && (
              <div className="space-y-2">
                <Label className="text-sm">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={styles.accentColor || '#6366f1'}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={styles.accentColor || '#6366f1'}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContentEditor = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Digite o título principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={block.data.subtitle || ''}
                onChange={(e) => updateData('subtitle', e.target.value)}
                placeholder="Digite o subtítulo"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={block.data.buttonText || ''}
                onChange={(e) => updateData('buttonText', e.target.value)}
                placeholder="Ex: Entre em contato"
              />
            </div>
            <div className="space-y-2">
              <Label>Link do Botão</Label>
              <Input
                value={block.data.buttonLink || ''}
                onChange={(e) => updateData('buttonLink', e.target.value)}
                placeholder="Ex: #contato"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem de Fundo</Label>
              <Input
                value={block.data.backgroundImage || ''}
                onChange={(e) => updateData('backgroundImage', e.target.value)}
                placeholder="https://... ou faça upload abaixo"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage === 'backgroundImage'}
                  onClick={() => document.getElementById('hero-bg-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImage === 'backgroundImage' ? 'Enviando...' : 'Enviar do Computador'}
                </Button>
                <input
                  id="hero-bg-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'backgroundImage');
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Sobre o Mandato"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={block.data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Digite a descrição do mandato..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <Input
                value={block.data.image || ''}
                onChange={(e) => updateData('image', e.target.value)}
                placeholder="https://... ou faça upload abaixo"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage === 'image'}
                  onClick={() => document.getElementById('about-img-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImage === 'image' ? 'Enviando...' : 'Enviar do Computador'}
                </Button>
                <input
                  id="about-img-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'image');
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Projetos e Propostas"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Projetos</Label>
                <Button
                  size="sm"
                  onClick={() => addArrayItem('projects', { id: Date.now().toString(), title: '', description: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              {(block.data.projects || []).map((project: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm">Projeto {idx + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem('projects', idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={project.title}
                      onChange={(e) => updateArrayItem('projects', idx, { ...project, title: e.target.value })}
                      placeholder="Título do projeto"
                    />
                    <Textarea
                      value={project.description}
                      onChange={(e) => updateArrayItem('projects', idx, { ...project, description: e.target.value })}
                      placeholder="Descrição"
                      rows={3}
                    />
                    <Input
                      value={project.image || ''}
                      onChange={(e) => updateArrayItem('projects', idx, { ...project, image: e.target.value })}
                      placeholder="https://... ou faça upload abaixo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage === `projects-${idx}-image`}
                      onClick={() => document.getElementById(`project-img-${idx}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage === `projects-${idx}-image` ? 'Enviando...' : 'Enviar Imagem'}
                    </Button>
                    <input
                      id={`project-img-${idx}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleArrayImageUpload(file, 'projects', idx, 'image');
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'news':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Notícias e Ações"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade de notícias a exibir</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={block.data.showLatest || 3}
                onChange={(e) => updateData('showLatest', parseInt(e.target.value) || 3)}
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Entre em Contato"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={block.data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Texto introdutório..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={block.data.enableForm !== false}
                onCheckedChange={(checked) => updateData('enableForm', checked)}
              />
              <Label>Habilitar formulário de contato</Label>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Galeria</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Galeria de Fotos"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Imagens</Label>
                <Button
                  size="sm"
                  onClick={() => addArrayItem('images', { url: '', caption: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              {(block.data.images || []).map((img: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm">Imagem {idx + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem('images', idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={img.url}
                      onChange={(e) => updateArrayItem('images', idx, { ...img, url: e.target.value })}
                      placeholder="https://... ou faça upload abaixo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage === `images-${idx}-url`}
                      onClick={() => document.getElementById(`gallery-img-${idx}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage === `images-${idx}-url` ? 'Enviando...' : 'Enviar Imagem'}
                    </Button>
                    <input
                      id={`gallery-img-${idx}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleArrayImageUpload(file, 'images', idx, 'url');
                      }}
                    />
                    <Input
                      value={img.caption || ''}
                      onChange={(e) => updateArrayItem('images', idx, { ...img, caption: e.target.value })}
                      placeholder="Legenda (opcional)"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={block.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Ex: Depoimentos"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Depoimentos</Label>
                <Button
                  size="sm"
                  onClick={() => addArrayItem('testimonials', { id: Date.now().toString(), name: '', role: '', text: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              {(block.data.testimonials || []).map((test: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm">Depoimento {idx + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem('testimonials', idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={test.name}
                      onChange={(e) => updateArrayItem('testimonials', idx, { ...test, name: e.target.value })}
                      placeholder="Nome"
                    />
                    <Input
                      value={test.role}
                      onChange={(e) => updateArrayItem('testimonials', idx, { ...test, role: e.target.value })}
                      placeholder="Cargo/Função"
                    />
                    <Textarea
                      value={test.text}
                      onChange={(e) => updateArrayItem('testimonials', idx, { ...test, text: e.target.value })}
                      placeholder="Texto do depoimento"
                      rows={3}
                    />
                    <Input
                      value={test.image || ''}
                      onChange={(e) => updateArrayItem('testimonials', idx, { ...test, image: e.target.value })}
                      placeholder="https://... ou faça upload abaixo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage === `testimonials-${idx}-image`}
                      onClick={() => document.getElementById(`testimonial-img-${idx}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage === `testimonials-${idx}-image` ? 'Enviando...' : 'Enviar Foto'}
                    </Button>
                    <input
                      id={`testimonial-img-${idx}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleArrayImageUpload(file, 'testimonials', idx, 'image');
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto do Rodapé</Label>
              <Input
                value={block.data.text || ''}
                onChange={(e) => updateData('text', e.target.value)}
                placeholder="Ex: © 2025 Todos os direitos reservados"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Links de Redes Sociais</Label>
                <Button
                  size="sm"
                  onClick={() => addArrayItem('socialLinks', { platform: 'facebook', url: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              {(block.data.socialLinks || []).map((link: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm">Link {idx + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem('socialLinks', idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <select
                      value={link.platform}
                      onChange={(e) => updateArrayItem('socialLinks', idx, { ...link, platform: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="email">E-mail</option>
                    </select>
                    <Input
                      value={link.url}
                      onChange={(e) => updateArrayItem('socialLinks', idx, { ...link, url: e.target.value })}
                      placeholder="URL do perfil"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Editor não disponível para este tipo de bloco.</p>;
    }
  };

  return (
    <div className="space-y-4">
      {renderEditor()}
    </div>
  );
}
