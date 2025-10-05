import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
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

// Usar ícone padrão do Leaflet (azul elegante)
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
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
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !selectedRoteiroData) return;

    // Inicializar o mapa apenas uma vez
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Limpar marcadores e polyline anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const map = mapRef.current;

    // Adicionar ponto de partida
    if (selectedRoteiroData.latitude_partida && selectedRoteiroData.longitude_partida) {
      const marker = L.marker(
        [selectedRoteiroData.latitude_partida, selectedRoteiroData.longitude_partida],
        { icon: defaultIcon }
      )
        .bindPopup(`<strong>🚀 Ponto de Partida</strong><br/>${selectedRoteiroData.endereco_partida || ''}`)
        .addTo(map);
      markersRef.current.push(marker);
    }

    // Adicionar pontos de parada
    pontos.forEach((ponto) => {
      if (ponto.latitude && ponto.longitude) {
        const marker = L.marker(
          [ponto.latitude, ponto.longitude],
          { icon: defaultIcon }
        )
          .bindPopup(
            `<strong>Parada #${ponto.ordem}</strong><br/>` +
            `${ponto.eleitores?.nome_completo || 'Eleitor não encontrado'}<br/>` +
            `${ponto.endereco_manual ? `<small>${ponto.endereco_manual}</small>` : ''}`
          )
          .addTo(map);
        markersRef.current.push(marker);
      }
    });

    // Adicionar ponto final
    if (selectedRoteiroData.latitude_final && selectedRoteiroData.longitude_final) {
      const marker = L.marker(
        [selectedRoteiroData.latitude_final, selectedRoteiroData.longitude_final],
        { icon: defaultIcon }
      )
        .bindPopup(`<strong>🏁 Ponto de Chegada</strong><br/>${selectedRoteiroData.endereco_final || ''}`)
        .addTo(map);
      markersRef.current.push(marker);
    }

    // Adicionar rota
    if (routeGeometry.length > 0) {
      polylineRef.current = L.polyline(routeGeometry, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7
      }).addTo(map);
      
      // Ajustar visualização para mostrar toda a rota
      map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
    } else if (markersRef.current.length > 0) {
      // Se não houver rota, centralizar no primeiro marcador
      map.setView(mapCenter, 13);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        if (polylineRef.current) {
          polylineRef.current.remove();
        }
      }
    };
  }, [selectedRoteiroData, pontos, routeGeometry, mapCenter]);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export const RoteirosMap = React.memo(RoteirosMapComponent);

