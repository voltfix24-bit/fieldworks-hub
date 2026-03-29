// react-leaflet v4 + leaflet v1.9
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProjects } from '@/hooks/use-projects';
import { MapPin, Plus, Minus, LocateFixed, Shield, ArrowRight, MessageCircle } from 'lucide-react';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

const CITY_COORDS: Record<string, [number, number]> = {
  amsterdam: [52.3676, 4.9041],
  rotterdam: [51.9244, 4.4777],
  utrecht: [52.0907, 5.1214],
  eindhoven: [51.4416, 5.4697],
  'den haag': [52.0705, 4.3007],
  groningen: [53.2194, 6.5665],
};
const DEFAULT_CENTER: [number, number] = [52.1326, 5.2913];

type ProjectStatus = 'planned' | 'completed';

function getCoords(project: any): [number, number] {
  if (project.latitude && project.longitude) return [project.latitude, project.longitude];
  const city = (project.city || '').toLowerCase().trim();
  return CITY_COORDS[city] || DEFAULT_CENTER;
}

function createMarkerIcon(status: ProjectStatus, selected: boolean) {
  const dotSize = selected ? 20 : 14;
  const isPlanned = status === 'planned';
  const color = isPlanned ? '#E8541A' : '#1D6B34';

  const pulseRing = isPlanned
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:rgba(232,84,26,0.2);animation:pulse 2s ease-in-out infinite;"></div>`
    : '';

  const pingAnim = selected
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${dotSize + 10}px;height:${dotSize + 10}px;border-radius:50%;background:${color}33;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
    : '';

  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        ${pulseRing}${pingAnim}
        <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px ${color}44;position:relative;z-index:2;"></div>
      </div>
      <style>
        @keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1}50%{transform:translate(-50%,-50%) scale(1.4);opacity:0.4}}
        @keyframes ping{75%,100%{transform:translate(-50%,-50%) scale(2);opacity:0}}
      </style>
    `,
  });
}

/* ── Zoom Controls ── */
function ZoomControls() {
  const map = useMap();
  const glass = 'bg-white/85 backdrop-blur-[20px] border border-white/80 shadow-[0_8px_32px_rgba(26,46,74,0.08)]';
  const btn = `w-[38px] h-[38px] rounded-lg ${glass} flex items-center justify-center text-[#1A2E4A] hover:bg-white/95 transition-colors cursor-pointer`;
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1.5">
      <button className={btn} onClick={() => map.zoomIn()}><Plus className="h-4 w-4" /></button>
      <button className={btn} onClick={() => map.zoomOut()}><Minus className="h-4 w-4" /></button>
      <button className={btn} onClick={() => map.setView(DEFAULT_CENTER, 7)}><LocateFixed className="h-4 w-4" /></button>
    </div>
  );
}

/* ── Filter Panel ── */
function FilterPanel({
  filters, setFilters, visibleCount,
}: {
  filters: Record<string, boolean>;
  setFilters: (f: Record<string, boolean>) => void;
  visibleCount: number;
}) {
  const items = [
    { key: 'planned', label: 'Gepland', color: '#E8541A' },
    { key: 'completed', label: 'Afgerond', color: '#1D6B34' },
  ];

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[220px] bg-white/85 backdrop-blur-[20px] rounded-xl border border-white/80 shadow-[0_8px_32px_rgba(26,46,74,0.08)] p-4">
      <p className="text-[9px] uppercase tracking-[1.5px] text-[#8098B0] font-semibold mb-3">Filter Projecten</p>
      <div className="space-y-2">
        {items.map(item => (
          <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filters[item.key] !== false}
              onChange={() => setFilters({ ...filters, [item.key]: !(filters[item.key] !== false) })}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filters[item.key] !== false ? 'border-[#1A2E4A] bg-[#1A2E4A]' : 'border-[#8098B0]/40'}`}>
              {filters[item.key] !== false && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[12px] text-[#1A2E4A] font-medium">{item.label}</span>
          </label>
        ))}
      </div>
      <div className="h-px bg-[#8098B0]/15 my-3" />
      <p className="text-[11px] text-[#4A6080]">{visibleCount} projecten zichtbaar</p>
    </div>
  );
}

/* ── Stat Mini Card ── */
function StatMiniCard({ count }: { count: number }) {
  return (
    <div className="absolute top-[180px] left-4 z-[1000] w-[220px] bg-white/85 backdrop-blur-[20px] rounded-xl border border-white/80 shadow-[0_8px_32px_rgba(26,46,74,0.08)] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#FFF0EB] flex items-center justify-center shrink-0">
        <Shield className="h-5 w-5 text-[#E8541A]" />
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[1.5px] text-[#8098B0] font-semibold">Actieve Klussen</p>
        <p className="text-[18px] font-black text-[#1A2E4A]">{count}</p>
      </div>
    </div>
  );
}

/* ── Detail Panel ── */
function DetailPanel({ project, onClose }: { project: any; onClose: () => void }) {
  const navigate = useNavigate();
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    planned: { label: 'Gepland', bg: 'bg-orange-100', text: 'text-orange-700' },
    completed: { label: 'Afgerond', bg: 'bg-green-100', text: 'text-green-700' },
  };
  const sc = statusConfig[project.status] || statusConfig.planned;
  const techName = project.technicians?.full_name || 'Niet toegewezen';
  const initials = techName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="absolute bottom-4 right-4 w-[340px] z-[1000] bg-white/90 backdrop-blur-[20px] rounded-2xl border border-white/80 shadow-[0_20px_60px_rgba(26,46,74,0.12)] p-5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between mb-2">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${sc.bg} ${sc.text}`}>
          {sc.label}
        </span>
        <button onClick={onClose} className="text-[#8098B0] hover:text-[#1A2E4A] text-lg leading-none">×</button>
      </div>

      <h3 className="text-[18px] font-black text-[#1A2E4A] leading-tight mb-1 font-sans">{project.project_name}</h3>
      <div className="flex items-center gap-1.5 text-[11px] text-[#8098B0] mb-4">
        <MapPin className="h-3 w-3" />
        <span>{[project.address_line_1, project.city].filter(Boolean).join(', ') || 'Geen adres'}</span>
      </div>

      {/* Monteur block */}
      <div className="bg-[#F4F7FA] rounded-lg p-2.5 flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded bg-[#1A2E4A] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1A2E4A] truncate">{techName}</p>
          <p className="text-[10px] text-[#8098B0]">Monteur</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-[#E8541A] flex items-center justify-center shrink-0">
          <MessageCircle className="h-3.5 w-3.5 text-white" />
        </button>
      </div>

      {/* Project number */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-center">
        <div className="bg-[#F4F7FA] rounded-lg py-2">
          <p className="text-[9px] uppercase tracking-wider text-[#8098B0] font-semibold">Nummer</p>
          <p className="text-[14px] font-bold text-[#1A2E4A]">{project.project_number}</p>
        </div>
        <div className="bg-[#F4F7FA] rounded-lg py-2">
          <p className="text-[9px] uppercase tracking-wider text-[#8098B0] font-semibold">Status</p>
          <p className="text-[14px] font-bold text-[#1A2E4A]">{sc.label}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(`/projects/${project.id}`)}
        className="w-full flex items-center justify-center gap-2 bg-[#E8541A] text-white py-2.5 rounded-md text-[13px] font-bold hover:bg-[#d14a16] transition-colors"
      >
        Bekijk project <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Main Map Page ── */
export default function MapPage() {
  const { data: projects = [] } = useProjects();
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return projects.filter(p => filters[p.status] !== false);
  }, [projects, filters]);

  const plannedCount = projects.filter(p => p.status === 'planned').length;
  const selectedProject = projects.find(p => p.id === selectedId);

  // Close panel on click outside
  useEffect(() => {
    const handler = () => setSelectedId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 60px)' }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={7}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filtered.map(project => {
          const coords = getCoords(project);
          const icon = createMarkerIcon(project.status as ProjectStatus, selectedId === project.id);
          return (
            <Marker
              key={project.id}
              position={coords}
              icon={icon}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedId(project.id);
                },
              }}
            />
          );
        })}
        <ZoomControls />
      </MapContainer>

      <FilterPanel filters={filters} setFilters={setFilters} visibleCount={filtered.length} />
      <StatMiniCard count={plannedCount} />
      {selectedProject && (
        <DetailPanel project={selectedProject} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
