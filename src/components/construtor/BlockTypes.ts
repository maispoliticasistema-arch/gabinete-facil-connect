export type BlockType = 
  | 'hero'
  | 'about'
  | 'projects'
  | 'news'
  | 'contact'
  | 'gallery'
  | 'testimonials'
  | 'footer';

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

export interface HeroData {
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
}

export interface AboutData {
  title: string;
  description: string;
  image?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  image?: string;
}

export interface ProjectsData {
  title: string;
  projects: ProjectData[];
}

export interface NewsData {
  title: string;
  showLatest: number;
}

export interface ContactData {
  title: string;
  description: string;
  enableForm: boolean;
}

export interface GalleryData {
  title: string;
  images: Array<{ url: string; caption?: string }>;
}

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  text: string;
  image?: string;
}

export interface TestimonialsData {
  title: string;
  testimonials: TestimonialData[];
}

export interface FooterData {
  text: string;
  socialLinks: Array<{ platform: string; url: string }>;
}

export const blockTypeLabels: Record<BlockType, string> = {
  hero: 'Hero / Cabeçalho',
  about: 'Sobre o Mandato',
  projects: 'Projetos / Propostas',
  news: 'Notícias e Ações',
  contact: 'Contato',
  gallery: 'Galeria de Fotos',
  testimonials: 'Depoimentos / Apoios',
  footer: 'Rodapé',
};

export const blockTypeDescriptions: Record<BlockType, string> = {
  hero: 'Título principal, subtítulo e botão de ação',
  about: 'Texto institucional com foto do político',
  projects: 'Lista de projetos e propostas',
  news: 'Mostra postagens recentes do gabinete',
  contact: 'Formulário para o cidadão enviar mensagens',
  gallery: 'Carrossel de imagens das ações e eventos',
  testimonials: 'Espaço para falas de cidadãos ou lideranças',
  footer: 'Links de redes sociais e informações básicas',
};

export const getDefaultBlockData = (type: BlockType): Record<string, any> => {
  switch (type) {
    case 'hero':
      return {
        title: 'Bem-vindo ao nosso gabinete',
        subtitle: 'Trabalhando por um futuro melhor',
        buttonText: 'Entre em contato',
        buttonLink: '#contato',
      };
    case 'about':
      return {
        title: 'Sobre o Mandato',
        description: 'Digite aqui a descrição do mandato...',
      };
    case 'projects':
      return {
        title: 'Projetos e Propostas',
        projects: [],
      };
    case 'news':
      return {
        title: 'Notícias e Ações',
        showLatest: 3,
      };
    case 'contact':
      return {
        title: 'Entre em Contato',
        description: 'Envie sua mensagem ou demanda',
        enableForm: true,
      };
    case 'gallery':
      return {
        title: 'Galeria',
        images: [],
      };
    case 'testimonials':
      return {
        title: 'Depoimentos',
        testimonials: [],
      };
    case 'footer':
      return {
        text: 'Todos os direitos reservados',
        socialLinks: [],
      };
    default:
      return {};
  }
};
