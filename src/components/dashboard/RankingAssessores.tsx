import { useEffect, useState } from 'react';
import { useGabinete } from '@/contexts/GabineteContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssessorRanking {
  user_id: string;
  nome_completo: string;
  total_cadastros: number;
  posicao: number;
}

export function RankingAssessores() {
  const { currentGabinete } = useGabinete();
  const { toast } = useToast();
  const [ranking, setRanking] = useState<AssessorRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGabinete) return;

    const fetchRanking = async () => {
      setLoading(true);
      try {
        // Buscar todos os assessores do gabinete
        const { data: assessores, error: assessoresError } = await supabase
          .from('user_gabinetes')
          .select('user_id, profiles(nome_completo)')
          .eq('gabinete_id', currentGabinete.gabinete_id)
          .eq('ativo', true);

        if (assessoresError) throw assessoresError;

        // Buscar contagem de cadastros para cada assessor
        const rankingData = await Promise.all(
          (assessores || []).map(async (assessor) => {
            const { count } = await supabase
              .from('eleitores')
              .select('*', { count: 'exact', head: true })
              .eq('gabinete_id', currentGabinete.gabinete_id)
              .eq('cadastrado_por', assessor.user_id);

            return {
              user_id: assessor.user_id,
              nome_completo: (assessor.profiles as any)?.nome_completo || 'Usuário',
              total_cadastros: count || 0,
              posicao: 0,
            };
          })
        );

        // Ordenar por total de cadastros e adicionar posição
        const rankingOrdenado = rankingData
          .sort((a, b) => b.total_cadastros - a.total_cadastros)
          .map((item, index) => ({
            ...item,
            posicao: index + 1,
          }));

        setRanking(rankingOrdenado);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        toast({
          title: 'Erro ao carregar ranking',
          description: 'Não foi possível carregar o ranking de assessores.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [currentGabinete, toast]);

  const getMedalIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum cadastro encontrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Cadastros de Eleitores</CardTitle>
        <p className="text-sm text-muted-foreground">
          Desempenho da equipe em cadastros realizados
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.map((assessor) => (
            <div
              key={assessor.user_id}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                assessor.posicao <= 3
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-background'
              }`}
            >
              <div className="flex items-center justify-center w-12">
                {getMedalIcon(assessor.posicao) || (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {assessor.posicao}
                  </span>
                )}
              </div>

              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(assessor.nome_completo)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold">{assessor.nome_completo}</p>
                <p className="text-sm text-muted-foreground">
                  {assessor.total_cadastros}{' '}
                  {assessor.total_cadastros === 1 ? 'cadastro' : 'cadastros'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {assessor.total_cadastros}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
