export type BlockType = 
  | 'hero'
  | 'about'
  | 'projects'
  | 'news'
  | 'contact'
  | 'gallery'
  | 'testimonials'
  | 'forms'
  | 'footer';

export interface BlockStyles {
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonHoverColor?: string;
  accentColor?: string;
  borderColor?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
  styles?: BlockStyles;
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

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

export interface FormsData {
  title: string;
  description: string;
  fields: FormField[];
  submitText: string;
  successMessage: string;
  linkTo?: 'demandas' | 'eleitores' | 'custom';
}

export const blockTypeLabels: Record<BlockType, string> = {
  hero: 'Hero / Cabeçalho',
  about: 'Sobre o Mandato',
  projects: 'Projetos / Propostas',
  news: 'Notícias e Ações',
  contact: 'Contato',
  gallery: 'Galeria de Fotos',
  testimonials: 'Depoimentos / Apoios',
  forms: 'Formulário Customizado',
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
  forms: 'Formulário customizável com campos personalizados',
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
    case 'forms':
      return {
        title: 'Fale Conosco',
        description: 'Preencha o formulário abaixo',
        fields: [
          { id: '1', label: 'Nome', type: 'text', required: true },
          { id: '2', label: 'Email', type: 'email', required: true },
          { id: '3', label: 'Mensagem', type: 'textarea', required: true },
        ],
        submitText: 'Enviar',
        successMessage: 'Formulário enviado com sucesso!',
        linkTo: 'custom',
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

export const getDefaultBlockStyles = (type: BlockType): BlockStyles => {
  switch (type) {
    case 'hero':
      return {
        backgroundColor: '#6366f1',
        textColor: '#ffffff',
        titleColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#6366f1',
        buttonHoverColor: '#f1f5f9',
      };
    case 'footer':
      return {
        backgroundColor: '#1e293b',
        textColor: '#e2e8f0',
        titleColor: '#ffffff',
      };
    case 'about':
    case 'projects':
    case 'news':
    case 'contact':
    case 'gallery':
    case 'testimonials':
    case 'forms':
      return {
        backgroundColor: '#ffffff',
        textColor: '#64748b',
        titleColor: '#1e293b',
        accentColor: '#6366f1',
        buttonColor: '#6366f1',
        buttonTextColor: '#ffffff',
        buttonHoverColor: '#4f46e5',
      };
    default:
      return {};
  }
};
