import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Users, Calendar, Map, Route, Shield } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Demandas',
    description: 'Protocolo automático, prazos, responsável e histórico completo de cada atendimento.'
  },
  {
    icon: Users,
    title: 'Eleitores',
    description: 'Cadastro completo, histórico de atendimentos e filtros avançados para segmentação.'
  },
  {
    icon: Calendar,
    title: 'Agenda',
    description: 'Compromissos da equipe com sincronização Google Calendar e lembretes automáticos.'
  },
  {
    icon: Map,
    title: 'Mapa',
    description: 'Inteligência territorial com clusters, heatmaps e visualização de dados geográficos.'
  },
  {
    icon: Route,
    title: 'Roteiros',
    description: 'Planeje rotas, registre visitas e faça check-in em campo com geolocalização.'
  },
  {
    icon: Shield,
    title: 'Permissões',
    description: 'Papéis e permissões granulares. Controle total sobre quem vê e faz o quê.'
  }
];

export const FeaturesSection = () => {
  return (
    <section id="recursos" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tudo que seu gabinete precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Recursos pensados para mandatos com alto volume de atendimentos e equipes colaborativas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-card-hover transition-smooth">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" asChild className="gradient-primary">
            <Link to="/auth">Criar gabinete</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
