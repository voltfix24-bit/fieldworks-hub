import { useMemo } from 'react';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { Marker } from 'react-leaflet/Marker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CITY_COORDS: Record<string, [number, number]> = {
  amsterdam: [52.3676, 4.9041], rotterdam: [51.9244, 4.4777], utrecht: [52.0907, 5.1214],
  eindhoven: [51.4416, 5.4697], 'den haag': [52.0705, 4.3007], groningen: [53.2194, 6.5665],
  tilburg: [51.5555, 5.0913], almere: [52.3508, 5.2647], breda: [51.5719, 4.7683],
  nijmegen: [51.8426, 5.8527], arnhem: [51.9851, 5.8987], haarlem: [52.3874, 4.6462],
  enschede: [52.2215, 6.8937], apeldoorn: [52.2112, 5.9699], amersfoort: [52.1561, 5.3878],
  'den bosch': [51.6998, 5.3049], "'s-hertogenbosch": [51.6998, 5.3049], zwolle: [52.5168, 6.0830],
  zoetermeer: [52.0575, 4.4931], leiden: [52.1601, 4.4970], maastricht: [50.8514, 5.6910],
  dordrecht: [51.8133, 4.6901], delft: [52.0116, 4.3571], alkmaar: [52.6324, 4.7534],
};

const DEFAULT_CENTER: [number, number] = [52.1326, 5.2913];

function getCoords(p: any): [number, number] | null {
  const city = (p.city || '').toLowerCase().trim().replace(/['']/g, '');
  return CITY_COORDS[city] || null;
}

function makeIcon(status: string) {
  const color = status === 'completed' ? '#1D6B34' : '#E8541A';
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>`,
  });
}

export function DashboardMiniMap({ projects }: { projects: any[] }) {
  const markers = useMemo(() => {
    return projects
      .map(p => ({ p, coords: getCoords(p) }))
      .filter((m): m is { p: any; coords: [number, number] } => m.coords !== null)
      .slice(0, 30);
  }, [projects]);

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-xl border border-border/25 shadow-[0_1px_4px_hsl(var(--foreground)/0.05)]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={7}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {markers.map(({ p, coords }) => (
          <Marker key={p.id} position={coords} icon={makeIcon(p.status)} />
        ))}
      </MapContainer>
    </div>
  );
}
