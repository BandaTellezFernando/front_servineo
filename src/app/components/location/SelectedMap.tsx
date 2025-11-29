"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
// Importamos L directamente como módulo, reemplazando el require
import L from "leaflet";

// Componentes dinámicos con SSR desactivado
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

type Props = {
  lat: number;
  lng: number;
  radiusMeters?: number;
  height?: number;
};

export default function SelectedMap({
  lat,
  lng,
  radiusMeters = 1000,
  height = 260,
}: Props) {
  // Estado para controlar que el componente solo se renderice en el cliente
  // Esto evita errores de hidratación y el uso de 'typeof window' en el render
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const icon = useMemo(() => {
    // Ya no usamos require(), usamos el L importado arriba.
    // L.Icon es seguro de llamar aquí.
    return new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  }, []);

  // Si no está montado en el cliente, no renderizamos nada (o un skeleton/loading)
  if (!isMounted) return null;

  return (
    <div style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker position={[lat, lng]} icon={icon} />
        <Circle
          center={[lat, lng]}
          radius={radiusMeters}
          pathOptions={{ color: "#2563eb", fillOpacity: 0.1 }}
        />
      </MapContainer>
    </div>
  );
}