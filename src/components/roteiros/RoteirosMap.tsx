import React from 'react';
import { MapPin } from 'lucide-react';

interface Ponto {
  id: string;
  ordem: number;
  latitude: number | null;
  longitude: number | null;
  endereco_manual: string | null;
  eleitores: {
    nome_completo: string;
  } | null;
}

interface Roteiro {
  id: string;
  nome: string;
  endereco_partida: string | null;
  latitude_partida: number | null;
  longitude_partida: number | null;
  endereco_final: string | null;
  latitude_final: number | null;
  longitude_final: number | null;
}

interface RoteirosMapProps {
  mapCenter: [number, number];
  selectedRoteiroData: Roteiro | null;
  routeGeometry: [number, number][];
  pontos: Ponto[];
}

const RoteirosMapComponent = ({
  mapCenter,
  selectedRoteiroData,
  routeGeometry,
  pontos,
}: RoteirosMapProps) => {
  if (!selectedRoteiroData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8">
        <MapPin className="h-16 w-16 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Selecione um roteiro</h3>
          <p className="text-sm">Clique em um roteiro na lista ao lado para visualizar no mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-6 gap-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Roteiro: {selectedRoteiroData.nome}</h3>
        </div>

        {selectedRoteiroData.endereco_partida && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">🚀</span>
              <div>
                <p className="font-medium text-sm">Ponto de Partida</p>
                <p className="text-sm text-muted-foreground">{selectedRoteiroData.endereco_partida}</p>
              </div>
            </div>
          </div>
        )}

        {pontos.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Paradas ({pontos.length})</h4>
            {pontos.map((ponto) => (
              <div key={ponto.id} className="p-3 bg-primary/5 border rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {ponto.ordem}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}</p>
                    {ponto.endereco_manual && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {ponto.endereco_manual}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRoteiroData.endereco_final && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">🏁</span>
              <div>
                <p className="font-medium text-sm">Ponto de Chegada</p>
                <p className="text-sm text-muted-foreground">{selectedRoteiroData.endereco_final}</p>
              </div>
            </div>
          </div>
        )}

        {routeGeometry.length > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Rota calculada com {routeGeometry.length} pontos
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Visualização em mapa será adicionada em breve
        </p>
      </div>
    </div>
  );
};

export const RoteirosMap = React.memo(RoteirosMapComponent);

