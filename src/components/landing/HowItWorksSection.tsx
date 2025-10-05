import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, Upload, Workflow } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    number: '01',
    title: 'Crie seu gabinete',
    description: 'Defina cidade, estado e convide sua equipe. Em minutos você está pronto.'
  },
  {
    icon: Upload,
    number: '02',
    title: 'Importe ou cadastre seus dados',
    description: 'Traga eleitores e demandas via CSV/Excel ou cadastre manualmente.'
  },
  {
    icon: Workflow,
    number: '03',
    title: 'Organize o trabalho',
    description: 'Use agenda, mapa e roteiros para executar e acompanhar tudo em tempo real.'
  }
];

export const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Três passos simples para começar a organizar seu gabinete hoje mesmo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 text-[120px] font-bold text-primary/5 leading-none">
                {step.number}
              </div>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4 relative z-10">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl relative z-10">{step.title}</CardTitle>
                <CardDescription className="text-base relative z-10">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" asChild className="gradient-primary">
            <Link to="/auth">Criar meu gabinete agora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
