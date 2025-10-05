import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Preciso de CNPJ?',
    answer: 'É recomendado para faturamento, mas a conta do gabinete pode estar vinculada à prefeitura, mandato ou associação que você representa.'
  },
  {
    question: 'Posso importar dados?',
    answer: 'Sim! Você pode importar eleitores e demandas via CSV ou Excel. O processo é assistido e validado para garantir qualidade dos dados.'
  },
  {
    question: 'Posso revogar ações de um assessor?',
    answer: 'Sim. Com o recurso de auditoria e reversão, você pode desfazer ações realizadas por qualquer membro da equipe dentro de um período determinado.'
  },
  {
    question: 'Quantos usuários posso ter?',
    answer: 'Depende do plano escolhido. O Essencial permite até 3 usuários, o Profissional até 10, e o Avançado é ilimitado.'
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim! O sistema é 100% responsivo e funciona como PWA (Progressive Web App), oferecendo experiência de app nativo.'
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Oferecemos suporte por email para todos os planos. Planos Profissional e Avançado têm suporte prioritário, e o Avançado inclui suporte dedicado.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem multas ou taxas. O cancelamento pode ser feito diretamente no painel e terá efeito no próximo ciclo de cobrança.'
  }
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o Gabinete Fácil
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
