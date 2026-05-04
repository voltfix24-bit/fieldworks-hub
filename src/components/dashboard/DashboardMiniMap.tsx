import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { Marker } from 'react-leaflet/Marker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, MapPin } from 'lucide-react';

const CITY_COORDS: Record<string, [number, number]> = {
  amsterdam: [52.3676, 4.9041], rotterdam: [51.9244, 4.4777], utrecht: [52.0907, 5.1214],
  eindhoven: [51.4416, 5.4697], 'den haag': [52.0705, 4.3007], groningen: [53.2194, 6.5665],
  tilburg: [51.5555, 5.0913], almere: [52.3508, 5.2647], breda: [51.5719, 4.7683],
  nijmegen: [51.8426, 5.8527], arnhem: [51.9851, 5.8987], haarlem: [52.3874, 4.6462],
  enschede: [52.2215, 6.8937], apeldoorn: [52.2112, 5.9699], amersfoort: [52.1561, 5.3878],
  'den bosch': [51.6998, 5.3049], "'s-hertogenbosch": [51.6998, 5.3049], zwolle: [52.5168, 6.0830],
  zoetermeer: [52.0575, 4.4931], leiden: [52.1601, 4.4970], maastricht: [50.8514, 5.6910],
  dordrecht: [51.8133, 4.6901], delft: [52.0116, 4.3571], alkmaar: [52.6324, 4.7534],
  kamerik: [52.1063, 4.8807],
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
  const navigate = useNavigate();

  const markers = useMemo(() => {
    return projects
      .map(p => ({ p, coords: getCoords(p) }))
      .filter((m): m is { p: any; coords: [number, number] } => m.coords !== null)
      .slice(0, 30);
  }, [projects]);

  return (
    <div
      onClick={() => navigate('/map')}
      className="relative h-[280px] w-full overflow-hidden rounded-3xl border border-border/20 shadow-[0_4px_16px_hsl(var(--foreground)/0.04)] hover:shadow-[0_8px_24px_hsl(var(--foreground)/0.08)] transition-all cursor-pointer group"
    >
      <div className="absolute inset-0 pointer-events-none">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={7}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {markers.map(({ p, coords }) => (
            <Marker key={p.id} position={coords} icon={makeIcon(p.status)} />
          ))}
        </MapContainer>
      </div>

      {/* Top-left label */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm">
        <MapPin className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-bold text-foreground">Kaartweergave</span>
        <span className="text-[10px] text-muted-foreground/60 ml-1">{markers.length}</span>
      </div>

      {/* Hover CTA */}
      <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
        <span className="text-[11px] font-bold">Open volledige kaart</span>
        <ArrowUpRight className="h-3 w-3" />
      </div>
    </div>
  );
}
