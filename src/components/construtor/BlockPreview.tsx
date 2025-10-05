import { Block } from './BlockTypes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Facebook, Instagram, Twitter, Image as ImageIcon } from 'lucide-react';

interface BlockPreviewProps {
  block: Block;
  colors: { primary: string; secondary: string };
}

export function BlockPreview({ block, colors }: BlockPreviewProps) {
  const styles = block.styles || {};
  
  const renderBlock = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div 
            className="relative min-h-[400px] flex items-center justify-center p-8"
            style={{ 
              backgroundColor: styles.backgroundColor || colors.primary,
              backgroundImage: block.data.backgroundImage ? `url(${block.data.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: styles.textColor || '#ffffff',
            }}
          >
            <div className="text-center max-w-3xl">
              <h1 
                className="text-5xl font-bold mb-4" 
                style={{ color: styles.titleColor || styles.textColor || '#ffffff' }}
              >
                {block.data.title || 'Título'}
              </h1>
              <p className="text-xl mb-8">{block.data.subtitle || 'Subtítulo'}</p>
              {block.data.buttonText && (
                <button
                  className="px-6 py-3 rounded-lg font-semibold transition-colors text-lg"
                  style={{
                    backgroundColor: styles.buttonColor || '#ffffff',
                    color: styles.buttonTextColor || colors.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.buttonHoverColor || '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = styles.buttonColor || '#ffffff';
                  }}
                >
                  {block.data.buttonText}
                </button>
              )}
            </div>
          </div>
        );

      case 'about':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#ffffff',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 
                  className="text-3xl font-bold mb-4"
                  style={{ color: styles.titleColor || colors.primary }}
                >
                  {block.data.title || 'Título'}
                </h2>
                <p className="text-lg whitespace-pre-wrap">
                  {block.data.description || 'Descrição...'}
                </p>
              </div>
              <div className="bg-muted rounded-lg aspect-square flex items-center justify-center">
                {block.data.image ? (
                  <img src={block.data.image} alt="Sobre" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#f8fafc',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-8 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Projetos'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {block.data.projects?.length > 0 ? (
                  block.data.projects.map((project: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      {project.image && (
                        <img src={project.image} alt={project.title} className="w-full h-40 object-cover rounded mb-4" />
                      )}
                      <h3 
                        className="font-semibold text-lg mb-2"
                        style={{ color: styles.accentColor || colors.primary }}
                      >
                        {project.title}
                      </h3>
                      <p className="text-sm">{project.description}</p>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-3 text-center">Nenhum projeto adicionado</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'news':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#ffffff',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-8 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Notícias'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].slice(0, block.data.showLatest || 3).map((i) => (
                  <Card key={i} className="p-4">
                    <div className="bg-muted h-40 rounded mb-4 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 
                      className="font-semibold mb-2"
                      style={{ color: styles.accentColor || colors.primary }}
                    >
                      Notícia {i}
                    </h3>
                    <p className="text-sm">Exemplo de notícia recente...</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#f8fafc',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-2xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-4 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Contato'}
              </h2>
              {block.data.description && (
                <p className="text-center mb-8">{block.data.description}</p>
              )}
              {block.data.enableForm && (
                <Card className="p-6">
                  <div className="space-y-4">
                    <input placeholder="Nome" className="w-full p-2 border rounded" />
                    <input placeholder="E-mail" className="w-full p-2 border rounded" />
                    <textarea placeholder="Mensagem" rows={4} className="w-full p-2 border rounded" />
                    <button
                      className="w-full py-3 rounded-lg font-semibold transition-colors"
                      style={{
                        backgroundColor: styles.buttonColor || colors.primary,
                        color: styles.buttonTextColor || '#ffffff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = styles.buttonHoverColor || colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = styles.buttonColor || colors.primary;
                      }}
                    >
                      Enviar Mensagem
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#ffffff',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-8 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Galeria'}
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                {block.data.images?.length > 0 ? (
                  block.data.images.map((img: any, idx: number) => (
                    <div key={idx} className="aspect-square">
                      <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover rounded" />
                    </div>
                  ))
                ) : (
                  <p className="col-span-4 text-center">Nenhuma imagem adicionada</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#f8fafc',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-8 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Depoimentos'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {block.data.testimonials?.length > 0 ? (
                  block.data.testimonials.map((test: any, idx: number) => (
                    <Card key={idx} className="p-6">
                      <p className="text-sm italic mb-4">"{test.text}"</p>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: styles.accentColor || colors.primary }}
                        >
                          {test.image ? (
                            <img src={test.image} alt={test.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-lg font-bold text-white">{test.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p 
                            className="font-semibold text-sm"
                            style={{ color: styles.titleColor || '#1e293b' }}
                          >
                            {test.name}
                          </p>
                          <p className="text-xs">{test.role}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-3 text-center">Nenhum depoimento adicionado</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'forms':
        return (
          <div 
            className="py-16 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || '#ffffff',
              color: styles.textColor || '#64748b',
            }}
          >
            <div className="max-w-2xl mx-auto">
              <h2 
                className="text-3xl font-bold mb-4 text-center"
                style={{ color: styles.titleColor || colors.primary }}
              >
                {block.data.title || 'Formulário'}
              </h2>
              {block.data.description && (
                <p className="text-center mb-8">{block.data.description}</p>
              )}
              
              <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                {block.data.fields?.length > 0 ? (
                  block.data.fields.map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: styles.titleColor || '#1e293b' }}>
                        {field.label}
                        {field.required && <span style={{ color: styles.accentColor || colors.primary }}>*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="w-full p-2 border rounded"
                          rows={3}
                          placeholder={field.label}
                          disabled
                        />
                      ) : field.type === 'select' ? (
                        <select className="w-full p-2 border rounded" disabled>
                          <option>Selecione...</option>
                          {field.options?.map((opt: string, i: number) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="w-full p-2 border rounded"
                          placeholder={field.label}
                          disabled
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">Nenhum campo adicionado ao formulário</p>
                )}
                
                {block.data.fields?.length > 0 && (
                  <button
                    className="w-full py-3 rounded-lg font-semibold transition-colors mt-6"
                    style={{
                      backgroundColor: styles.buttonColor || colors.primary,
                      color: styles.buttonTextColor || '#ffffff',
                    }}
                    disabled
                  >
                    {block.data.submitText || 'Enviar'}
                  </button>
                )}
              </div>
              
              {block.data.linkTo && (
                <p className="text-xs text-center mt-4" style={{ color: styles.textColor }}>
                  {block.data.linkTo === 'demandas' && '📋 Este formulário criará demandas automaticamente'}
                  {block.data.linkTo === 'eleitores' && '👥 Este formulário cadastrará eleitores automaticamente'}
                  {block.data.linkTo === 'custom' && '📝 Este formulário salvará respostas customizadas'}
                </p>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div 
            className="py-12 px-8"
            style={{ 
              backgroundColor: styles.backgroundColor || colors.primary,
              color: styles.textColor || '#ffffff',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm">{block.data.text || '© Todos os direitos reservados'}</p>
                <div className="flex gap-4">
                  {block.data.socialLinks?.map((link: any, idx: number) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                      {link.platform === 'facebook' && <Facebook className="h-5 w-5" />}
                      {link.platform === 'instagram' && <Instagram className="h-5 w-5" />}
                      {link.platform === 'twitter' && <Twitter className="h-5 w-5" />}
                      {link.platform === 'email' && <Mail className="h-5 w-5" />}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-8 text-center text-muted-foreground">Bloco desconhecido</div>;
    }
  };

  return <div className="w-full">{renderBlock()}</div>;
}
