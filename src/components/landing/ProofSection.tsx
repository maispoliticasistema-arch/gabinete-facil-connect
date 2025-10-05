import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

export const ProofSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <p className="text-lg sm:text-xl text-muted-foreground">
            +50 gabinetes já organizam a rotina com o Gabinete Fácil.
          </p>
        </div>

        {/* Depoimento */}
        <Card className="max-w-3xl mx-auto shadow-card">
          <CardContent className="p-8">
            <Quote className="h-8 w-8 text-primary mb-4" />
            <p className="text-lg sm:text-xl mb-6 italic">
              "Aumentamos nossa produtividade em 40% depois que centralizamos todas as demandas e 
              informações dos eleitores no Gabinete Fácil. A equipe toda tem acesso ao que precisa."
            </p>
            <div>
              <p className="font-semibold">Maria Silva</p>
              <p className="text-sm text-muted-foreground">
                Chefe de Gabinete • Vereança de São Paulo/SP
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
