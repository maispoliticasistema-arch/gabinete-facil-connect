import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Block, FormField } from './BlockTypes';

interface FormularioPortalProps {
  block: Block;
  gabineteId: string;
  colors: { primary: string; secondary: string };
}

export function FormularioPortal({ block, gabineteId, colors }: FormularioPortalProps) {
  const styles = block.styles || {};
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Limpar erro do campo quando o usuário digita
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = block.data.fields as FormField[] || [];

    fields.forEach(field => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = 'Este campo é obrigatório';
      }

      // Validar email
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Email inválido';
        }
      }

      // Validar telefone
      if (field.type === 'tel' && formData[field.id]) {
        const telRegex = /^[\d\s\(\)\-\+]+$/;
        if (!telRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Telefone inválido';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);

    try {
      const linkTo = block.data.linkTo;
      const fields = block.data.fields as FormField[] || [];

      if (linkTo === 'demandas') {
        // Criar demanda
        const titulo = formData[fields.find(f => f.label.toLowerCase().includes('assunto') || f.label.toLowerCase().includes('título'))?.id || fields[0]?.id] || 'Demanda via Portal';
        const descricao = formData[fields.find(f => f.label.toLowerCase().includes('mensagem') || f.label.toLowerCase().includes('descrição') || f.type === 'textarea')?.id || ''] || '';

        const { error } = await supabase
          .from('demandas')
          .insert({
            gabinete_id: gabineteId,
            titulo,
            descricao,
            status: 'aberta',
            prioridade: 'media',
          });

        if (error) throw error;
      } else if (linkTo === 'eleitores') {
        // Cadastrar eleitor
        const nomeField = fields.find(f => f.label.toLowerCase().includes('nome'));
        const emailField = fields.find(f => f.type === 'email');
        const telefoneField = fields.find(f => f.type === 'tel');

        if (!nomeField) {
          throw new Error('Formulário precisa ter um campo de nome para cadastrar eleitores');
        }

        const { error } = await supabase
          .from('eleitores')
          .insert({
            gabinete_id: gabineteId,
            nome_completo: formData[nomeField.id],
            email: emailField ? formData[emailField.id] : null,
            telefone: telefoneField ? formData[telefoneField.id] : null,
            via_link_indicacao: true,
          });

        if (error) throw error;
      } else {
        // Salvar como resposta customizada
        const formattedData: Record<string, string> = {};
        fields.forEach(field => {
          formattedData[field.label] = formData[field.id] || '';
        });

        const { error } = await supabase
          .from('portal_form_submissions')
          .insert({
            gabinete_id: gabineteId,
            form_id: block.id,
            form_title: block.data.title || 'Formulário sem título',
            data: formattedData,
          });

        if (error) throw error;
      }

      setSubmitted(true);
      setFormData({});
      toast.success(block.data.successMessage || 'Formulário enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(error.message || 'Erro ao enviar formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div 
        className="py-16 px-8"
        style={{ 
          backgroundColor: styles.backgroundColor || '#ffffff',
          color: styles.textColor || '#64748b',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle2 
            className="h-16 w-16 mx-auto mb-4" 
            style={{ color: styles.accentColor || colors.primary }}
          />
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: styles.titleColor || colors.primary }}
          >
            {block.data.successMessage || 'Formulário Enviado!'}
          </h2>
          <p className="mb-6">
            Recebemos suas informações. Entraremos em contato em breve!
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            style={{
              backgroundColor: styles.buttonColor || colors.primary,
              color: styles.buttonTextColor || '#ffffff',
            }}
          >
            Enviar Outro
          </Button>
        </div>
      </div>
    );
  }

  const fields = (block.data.fields as FormField[]) || [];

  return (
    <div 
      className="py-16 px-8"
      style={{ 
        backgroundColor: styles.backgroundColor || '#ffffff',
        color: styles.textColor || '#64748b',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 
          className="text-3xl font-bold mb-4 text-center"
          style={{ color: styles.titleColor || colors.primary }}
        >
          {block.data.title || 'Formulário'}
        </h2>
        {block.data.description && (
          <p className="text-center mb-8">{block.data.description}</p>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} style={{ color: styles.titleColor || '#1e293b' }}>
                {field.label}
                {field.required && <span style={{ color: styles.accentColor || colors.primary }}> *</span>}
              </Label>
              
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.label}
                  required={field.required}
                  rows={4}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                  className={`w-full p-2 border rounded ${errors[field.id] ? 'border-red-500' : ''}`}
                >
                  <option value="">Selecione...</option>
                  {field.options?.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.label}
                  required={field.required}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {errors[field.id] && (
                <p className="text-xs text-red-500">{errors[field.id]}</p>
              )}
            </div>
          ))}
          
          <Button
            type="submit"
            disabled={submitting}
            className="w-full mt-6"
            style={{
              backgroundColor: styles.buttonColor || colors.primary,
              color: styles.buttonTextColor || '#ffffff',
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              block.data.submitText || 'Enviar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
