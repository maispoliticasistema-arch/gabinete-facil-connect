import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-r from-primary to-accent">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Pronto para profissionalizar a gestão do seu gabinete?
        </h2>
        <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Junte-se a dezenas de mandatos que já transformaram sua rotina com o Gabinete Fácil.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary" 
            asChild
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link to="/auth">Criar gabinete</Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            asChild
            className="border-white text-white hover:bg-white/10"
          >
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
