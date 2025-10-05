import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, FileCheck, Database, Key } from 'lucide-react';

const securityFeatures = [
  {
    icon: Shield,
    title: 'RLS por gabinete',
    description: 'Row Level Security garante que cada usuário vê apenas o que tem permissão.'
  },
  {
    icon: FileCheck,
    title: 'Logs imutáveis',
    description: 'Auditoria completa com reversão de ações por período determinado.'
  },
  {
    icon: Key,
    title: 'Sessões controladas',
    description: 'Gerencie dispositivos ativos e faça logout remoto quando necessário.'
  }
];

const lgpdFeatures = [
  {
    icon: Eye,
    title: 'Finalidade e minimização',
    description: 'Coletamos apenas dados necessários com consentimento explícito.'
  },
  {
    icon: Database,
    title: 'Retenção e criptografia',
    description: 'Dados em repouso e transporte protegidos com criptografia de ponta.'
  },
  {
    icon: Lock,
    title: 'Exportação e exclusão',
    description: 'Exporte ou delete dados sob demanda do controlador. DPO disponível.'
  }
];

export const SecuritySection = () => {
  return (
    <section id="seguranca" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Segurança & LGPD
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seus dados, sob seu controle. Conformidade com LGPD e melhores práticas de segurança.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Segurança */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Segurança</h3>
            <div className="space-y-4">
              {securityFeatures.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* LGPD */}
          <div id="lgpd">
            <h3 className="text-2xl font-bold mb-6">LGPD</h3>
            <div className="space-y-4">
              {lgpdFeatures.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg gradient-success flex items-center justify-center shrink-0">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              <a href="#" className="text-primary hover:underline">
                Saiba mais sobre nossa política de privacidade
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
