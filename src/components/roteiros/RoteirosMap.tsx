import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

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

// Componente para atualizar o centro do mapa
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
};

// Ícones customizados
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={mapCenter} />

      {/* Ponto de Partida */}
      {selectedRoteiroData.latitude_partida && selectedRoteiroData.longitude_partida && (
        <Marker 
          position={[selectedRoteiroData.latitude_partida, selectedRoteiroData.longitude_partida]}
          icon={startIcon}
        >
          <Popup>
            <div>
              <strong>🚀 Ponto de Partida</strong>
              <p className="text-sm">{selectedRoteiroData.endereco_partida}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Pontos de Parada */}
      {pontos.map((ponto) => (
        ponto.latitude && ponto.longitude && (
          <Marker 
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={stopIcon}
          >
            <Popup>
              <div>
                <strong>Parada #{ponto.ordem}</strong>
                <p className="text-sm">{ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}</p>
                {ponto.endereco_manual && (
                  <p className="text-xs text-muted-foreground">{ponto.endereco_manual}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Ponto Final */}
      {selectedRoteiroData.latitude_final && selectedRoteiroData.longitude_final && (
        <Marker 
          position={[selectedRoteiroData.latitude_final, selectedRoteiroData.longitude_final]}
          icon={endIcon}
        >
          <Popup>
            <div>
              <strong>🏁 Ponto de Chegada</strong>
              <p className="text-sm">{selectedRoteiroData.endereco_final}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Rota */}
      {routeGeometry.length > 0 && (
        <Polyline 
          positions={routeGeometry} 
          color="#3b82f6"
          weight={4}
          opacity={0.7}
        />
      )}
    </MapContainer>
  );
};

export const RoteirosMap = React.memo(RoteirosMapComponent);

