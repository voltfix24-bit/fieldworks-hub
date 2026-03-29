// react-leaflet v4 + leaflet v1.9
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { Marker } from 'react-leaflet/Marker';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProjects } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { useClients } from '@/hooks/use-clients';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Minus, LocateFixed, Shield, ArrowRight, MessageCircle, Building2, Timer, Zap, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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
const NL_BOUNDS: L.LatLngBoundsExpression = [
  [50.75, 3.2],  // southwest
  [53.7, 7.22],  // northeast
];

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

/* ── New Project Sheet ── */
function NewProjectSheet({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { data: technicians = [] } = useTechnicians();
  const { data: clients = [] } = useClients();
  const queryClient = useQueryClient();
  const [projectType, setProjectType] = useState<'ms_installatie' | 'compactstation' | 'provisorium'>('ms_installatie');
  const [form, setForm] = useState({ name: '', city: 'amsterdam', technician_id: '', client_id: '', planned_date: '' });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await supabase.from('projects').insert({
        project_name: form.name.trim(),
        city: form.city,
        status: 'planned' as const,
        technician_id: form.technician_id || null,
        client_id: form.client_id || null,
        planned_date: form.planned_date || null,
        tenant_id: profile?.tenant_id || '',
        project_number: 'PRJ-' + Date.now().toString().slice(-6),
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setForm({ name: '', city: 'amsterdam', technician_id: '', client_id: '', planned_date: '' });
      setProjectType('ms_installatie');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = 'w-full bg-[#F4F7FA] rounded-lg px-3.5 py-3 border-none text-[14px] font-semibold text-[#1A2E4A] outline-none focus:ring-2 focus:ring-[#E8541A] focus:ring-offset-0';
  const labelCls = 'block text-[9px] uppercase tracking-[1.5px] text-[#8098B0] font-semibold mb-1.5';

  const types = [
    { key: 'ms_installatie' as const, label: 'MS-installatie', icon: Zap },
    { key: 'compactstation' as const, label: 'Compactstation', icon: Building2 },
    { key: 'provisorium' as const, label: 'Provisorium', icon: Timer },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 z-[900]"
        style={{ background: 'rgba(26,46,74,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute top-0 right-0 bottom-0 z-[1000] flex flex-col"
        style={{
          width: 480,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '-40px 0 80px rgba(26,46,74,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 relative">
          <p className="text-[10px] uppercase font-bold tracking-[2px] text-[#E8541A] mb-1">NIEUW PROJECT</p>
          <h2 className="text-[28px] font-black text-[#1A2E4A]">Project toevoegen</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-7 h-7 rounded-md flex items-center justify-center text-[#8098B0] hover:bg-[#F4F7FA] hover:text-[#1A2E4A] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          <div>
            <label className={labelCls}>PROJECTNAAM</label>
            <input className={inputCls} placeholder="Naam van het project" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>LOCATIE</label>
            <select className={inputCls} value={form.city} onChange={e => update('city', e.target.value)}>
              {['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'Den Haag', 'Groningen', 'Haarlem', 'Breda'].map(c => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>PROJECTTYPE</label>
            <div className="grid grid-cols-3 gap-2">
              {types.map(t => {
                const active = projectType === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setProjectType(t.key)}
                    className="flex flex-col items-center gap-1.5 py-3.5 rounded-lg border-2 transition-colors"
                    style={{
                      background: active ? '#E8541A' : '#F4F7FA',
                      color: active ? 'white' : '#4A6080',
                      borderColor: active ? '#E8541A' : 'transparent',
                    }}
                  >
                    <t.icon className="h-5 w-5" />
                    <span className="text-[10px] uppercase font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>MONTEUR</label>
            <select className={inputCls} value={form.technician_id} onChange={e => update('technician_id', e.target.value)}>
              <option value="">Selecteer monteur</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>OPDRACHTGEVER</label>
            <select className={inputCls} value={form.client_id} onChange={e => update('client_id', e.target.value)}>
              <option value="">Selecteer opdrachtgever</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>GEPLANDE DATUM</label>
            <input type="date" className={inputCls} value={form.planned_date} onChange={e => update('planned_date', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-5 border-t border-[#EEF3F8] space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-[13px] font-bold uppercase tracking-[0.5px] transition-colors disabled:opacity-50"
            style={{ background: '#E8541A', color: 'white' }}
          >
            {saving ? 'Aanmaken...' : 'Project aanmaken →'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-[#F4F7FA] text-[#4A6080] text-[13px] font-semibold hover:bg-[#EEF3F8] transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main Map Page ── */
export default function MapPage() {
  const { data: projects = [] } = useProjects();
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
        zoom={8}
        minZoom={7}
        maxZoom={18}
        maxBounds={NL_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
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

      {/* New project button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="absolute top-[270px] left-4 z-[1000] flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-[0.5px] transition-colors hover:opacity-90"
        style={{ background: '#1A2E4A', color: 'white' }}
      >
        <Plus className="h-3.5 w-3.5" /> Nieuw project
      </button>

      {selectedProject && (
        <DetailPanel project={selectedProject} onClose={() => setSelectedId(null)} />
      )}

      <NewProjectSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
