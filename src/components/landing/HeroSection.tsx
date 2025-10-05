import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Gestão de gabinete simples, segura e rápida.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Centralize demandas, eleitores, agenda, mapa e roteiros em um único painel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
              <Button size="lg" asChild className="gradient-primary text-base">
                <Link to="/auth">Criar gabinete</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/auth">Entrar</Link>
              </Button>
            </div>

            {/* Bullets de valor */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base text-left">
                  <strong>Segurança nível gabinete</strong> — RLS, auditoria e reversão de ações.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base text-left">
                  <strong>Performance com cache</strong> por gabinete.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base text-left">
                  <strong>Multi-usuário</strong> com permissões personalizadas.
                </p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="rounded-2xl shadow-card-hover bg-card p-6 border">
              <div className="space-y-4">
                {/* Mockup Dashboard */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="text-3xl font-bold text-primary mb-1">1.234</div>
                    <div className="text-sm text-muted-foreground">Eleitores</div>
                  </div>
                  <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                    <div className="text-3xl font-bold text-success mb-1">89</div>
                    <div className="text-sm text-muted-foreground">Demandas</div>
                  </div>
                  <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                    <div className="text-3xl font-bold text-accent mb-1">12</div>
                    <div className="text-sm text-muted-foreground">Eventos</div>
                  </div>
                  <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
                    <div className="text-3xl font-bold text-warning mb-1">5</div>
                    <div className="text-sm text-muted-foreground">Roteiros</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
