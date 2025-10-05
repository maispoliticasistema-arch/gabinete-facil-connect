import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const createNumberIcon = (numero: number) => {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg">${numero}</div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createCustomIcon = (color: string, emoji: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-size: 20px;">${emoji}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  const roteiroPartidaIcon = createCustomIcon('#22c55e', '🚀');
  const roteiroFimIcon = createCustomIcon('#3b82f6', '🏁');

  if (!mapCenter || mapCenter.length !== 2) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        Selecione um roteiro para visualizar no mapa
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selectedRoteiroData?.latitude_partida && selectedRoteiroData?.longitude_partida && (
        <Marker
          position={[selectedRoteiroData.latitude_partida, selectedRoteiroData.longitude_partida]}
          icon={roteiroPartidaIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🚀 Ponto de Partida</strong>
              <br />
              {selectedRoteiroData.endereco_partida || 'Endereço de partida'}
            </div>
          </Popup>
        </Marker>
      )}

      {selectedRoteiroData?.latitude_final && selectedRoteiroData?.longitude_final && (
        <Marker
          position={[selectedRoteiroData.latitude_final, selectedRoteiroData.longitude_final]}
          icon={roteiroFimIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🏁 Ponto de Chegada</strong>
              <br />
              {selectedRoteiroData.endereco_final || 'Endereço final'}
            </div>
          </Popup>
        </Marker>
      )}

      {routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
        />
      )}

      {pontos.map((ponto) => 
        ponto.latitude && ponto.longitude ? (
          <Marker
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={createNumberIcon(ponto.ordem)}
          >
            <Popup>
              <div className="text-sm">
                <strong>Parada {ponto.ordem}</strong>
                <br />
                {ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}
                {ponto.endereco_manual && (
                  <>
                    <br />
                    <span className="text-xs bg-secondary px-1 rounded">Endereço alternativo:</span>
                    <br />
                    <span className="text-muted-foreground">{ponto.endereco_manual}</span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
};

export const RoteirosMap = React.memo(RoteirosMapComponent);
