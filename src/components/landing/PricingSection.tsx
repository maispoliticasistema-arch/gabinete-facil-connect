import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Essencial',
    price: 'R$ 197',
    description: 'Para mandatos iniciantes',
    features: [
      'Até 3 usuários',
      '1.000 eleitores',
      '500 demandas/mês',
      'Suporte por email',
      'Relatórios básicos'
    ]
  },
  {
    name: 'Profissional',
    price: 'R$ 397',
    description: 'Ideal para a maioria dos gabinetes',
    popular: true,
    features: [
      'Até 10 usuários',
      '10.000 eleitores',
      'Demandas ilimitadas',
      'Suporte prioritário',
      'Relatórios avançados',
      'Integração Google Calendar',
      'Auditoria completa'
    ]
  },
  {
    name: 'Avançado',
    price: 'Sob consulta',
    description: 'Para mandatos de grande porte',
    features: [
      'Usuários ilimitados',
      'Eleitores ilimitados',
      'Demandas ilimitadas',
      'Suporte dedicado',
      'Relatórios personalizados',
      'Treinamento da equipe',
      'API personalizada'
    ]
  }
];

export const PricingSection = () => {
  return (
    <section id="planos" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Planos e preços
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Escolha o plano ideal para o seu gabinete. Sem taxa de setup. Cancele quando quiser.
          </p>
          <p className="text-sm text-muted-foreground">
            Cobrança mensal. Nota fiscal emitida.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-card-hover' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary">
                  Mais popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price.includes('R$') && (
                    <span className="text-muted-foreground">/mês</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'gradient-primary' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link to="/auth">Criar gabinete</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
