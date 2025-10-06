import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Gabinete {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  descricao: string | null;
  slogan?: string | null;
  endereco_completo?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cep?: string | null;
}

interface InfoGabineteProps {
  gabinete: Gabinete;
}

export function InfoGabinete({ gabinete }: InfoGabineteProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: gabinete.nome,
    cidade: gabinete.cidade || "",
    estado: gabinete.estado || "",
    descricao: gabinete.descricao || "",
    slogan: gabinete.slogan || "",
    endereco_completo: gabinete.endereco_completo || "",
    numero: gabinete.numero || "",
    bairro: gabinete.bairro || "",
    cep: gabinete.cep || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("gabinetes")
        .update({
          nome: formData.nome,
          cidade: formData.cidade,
          estado: formData.estado,
          descricao: formData.descricao,
          slogan: formData.slogan,
          endereco_completo: formData.endereco_completo,
          numero: formData.numero,
          bairro: formData.bairro,
          cep: formData.cep,
        })
        .eq("id", gabinete.id);

      if (error) throw error;

      toast.success("Informações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar gabinete:", error);
      toast.error("Erro ao atualizar informações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Informações do Gabinete</h2>
        <p className="text-muted-foreground mt-1">
          Dados institucionais básicos do gabinete
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Gabinete *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Gabinete do Vereador João Silva"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slogan">Slogan / Descrição Curta</Label>
          <Input
            id="slogan"
            value={formData.slogan}
            onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
            placeholder="Ex: Trabalhando por uma cidade melhor"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Ex: Porto Alegre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              placeholder="Ex: RS"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição Detalhada</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Informações adicionais sobre o gabinete..."
            rows={4}
          />
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-1">Endereço para Etiquetas de Remetente</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Informações usadas ao gerar etiquetas com dados do gabinete
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="endereco_completo">Endereço</Label>
                <Input
                  id="endereco_completo"
                  value={formData.endereco_completo}
                  onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                  placeholder="Ex: Rua das Flores"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Ex: Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
}
