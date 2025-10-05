import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const LandingHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/inicio" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Gabinete Fácil</span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#recursos" className="text-sm hover:text-primary transition-smooth">
              Recursos
            </a>
            <a href="#como-funciona" className="text-sm hover:text-primary transition-smooth">
              Como funciona
            </a>
            <a href="#planos" className="text-sm hover:text-primary transition-smooth">
              Planos
            </a>
            <a href="#seguranca" className="text-sm hover:text-primary transition-smooth">
              Segurança
            </a>
            <a href="#lgpd" className="text-sm hover:text-primary transition-smooth">
              LGPD
            </a>
            <a href="#faq" className="text-sm hover:text-primary transition-smooth">
              FAQ
            </a>
            <a href="#contato" className="text-sm hover:text-primary transition-smooth">
              Contato
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" asChild className="gradient-primary">
              <Link to="/auth">Começar agora</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
