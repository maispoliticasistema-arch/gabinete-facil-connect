import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer id="contato" className="bg-muted/30 py-12 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo e descrição */}
          <div>
            <Link to="/inicio" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Gabinete Fácil</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Gestão de gabinete simples, segura e rápida.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#recursos" className="text-muted-foreground hover:text-primary transition-smooth">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-smooth">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#planos" className="text-muted-foreground hover:text-primary transition-smooth">
                  Planos
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Termos de uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#lgpd" className="text-muted-foreground hover:text-primary transition-smooth">
                  LGPD
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:contato@gabinetefacil.com.br" className="text-muted-foreground hover:text-primary transition-smooth">
                  contato@gabinietefacil.com.br
                </a>
              </li>
              <li>
                <a href="mailto:suporte@gabinietefacil.com.br" className="text-muted-foreground hover:text-primary transition-smooth">
                  Suporte
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Gabinete Fácil. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
