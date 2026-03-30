// react-leaflet v4 + leaflet v1.9
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { Marker } from 'react-leaflet/Marker';
import { useMap } from 'react-leaflet/hooks';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProjects } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { useClients } from '@/hooks/use-clients';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Minus, LocateFixed, Shield, ArrowRight, MessageCircle, X, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEquipmentList, useDefaultEquipment } from '@/hooks/use-equipment';
import { useCreateProject, useProjects as useAllProjects } from '@/hooks/use-projects';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  tilburg: [51.5555, 5.0913],
  almere: [52.3508, 5.2647],
  breda: [51.5719, 4.7683],
  nijmegen: [51.8426, 5.8527],
  arnhem: [51.9851, 5.8987],
  haarlem: [52.3874, 4.6462],
  enschede: [52.2215, 6.8937],
  apeldoorn: [52.2112, 5.9699],
  amersfoort: [52.1561, 5.3878],
  'den bosch': [51.6998, 5.3049],
  "'s-hertogenbosch": [51.6998, 5.3049],
  zwolle: [52.5168, 6.0830],
  zoetermeer: [52.0575, 4.4931],
  leiden: [52.1601, 4.4970],
  maastricht: [50.8514, 5.6910],
  dordrecht: [51.8133, 4.6901],
  delft: [52.0116, 4.3571],
  alkmaar: [52.6324, 4.7534],
  deventer: [52.2551, 6.1639],
  leeuwarden: [53.2012, 5.7999],
  hilversum: [52.2292, 5.1669],
  venlo: [51.3704, 6.1724],
  heerlen: [50.8882, 5.9815],
  roosendaal: [51.5308, 4.4655],
  oss: [51.7654, 5.5183],
  gouda: [52.0115, 4.7104],
  zaandam: [52.4389, 4.8264],
  ede: [52.0478, 5.6651],
  emmen: [52.7792, 6.9008],
  bergen_op_zoom: [51.4949, 4.2882],
  veenendaal: [52.0281, 5.5567],
  helmond: [51.4792, 5.6571],
  purmerend: [52.5050, 4.9597],
  schiedam: [51.9217, 4.3989],
  vlaardingen: [51.9120, 4.3421],
  almelo: [52.3564, 6.6625],
  hoorn: [52.6424, 5.0594],
  hoofddorp: [52.3040, 4.6911],
  capelle_aan_den_ijssel: [51.9291, 4.5781],
  spijkenisse: [51.8450, 4.3290],
};
const DEFAULT_CENTER: [number, number] = [52.1326, 5.2913];
const NL_BOUNDS: L.LatLngBoundsExpression = [
  [50.75, 3.2],  // southwest
  [53.7, 7.22],  // northeast
];

type ProjectStatus = 'planned' | 'completed';

/* ── Geocoding via PDOK Locatieserver (free Dutch gov API) ── */
const geocodeCache = new Map<string, [number, number] | null>();

function buildAddressQuery(project: any): string | null {
  const parts: string[] = [];
  if (project.address_line_1) parts.push(project.address_line_1);
  if (project.postal_code) parts.push(project.postal_code);
  if (project.city) parts.push(project.city);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

async function geocodeAddress(query: string): Promise<[number, number] | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  try {
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&rows=1&fq=type:adres OR type:postcode OR type:woonplaats`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('PDOK fetch failed');
    const data = await res.json();
    const doc = data?.response?.docs?.[0];
    if (doc?.centroide_ll) {
      // PDOK returns "POINT(lng lat)"
      const match = doc.centroide_ll.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        if (lat >= 50.5 && lat <= 53.8 && lng >= 3.0 && lng <= 7.5) {
          const coords: [number, number] = [lat, lng]; // Leaflet expects [lat, lng]
          geocodeCache.set(query, coords);
          return coords;
        }
      }
    }
    geocodeCache.set(query, null);
    return null;
  } catch {
    return null;
  }
}

function getCoordsFallback(project: any): [number, number] | null {
  const city = (project.city || '').toLowerCase().trim().replace(/['']/g, '').replace(/\s+/g, '_');
  return CITY_COORDS[city] || CITY_COORDS[city.replace(/_/g, ' ')] || null;
}

/** Hook: geocode all projects and return a map of id → [lat, lng] */
function useGeocodedCoords(projects: any[]) {
  const [coords, setCoords] = useState<Record<string, [number, number]>>({});
  const processed = useRef(new Set<string>());

  useEffect(() => {
    if (!projects.length) return;
    let cancelled = false;

    const geocodeAll = async () => {
      const updates: Record<string, [number, number]> = {};
      // Process in small batches to avoid hammering the API
      for (const project of projects) {
        if (cancelled) break;
        if (processed.current.has(project.id)) continue;
        processed.current.add(project.id);

        const query = buildAddressQuery(project);
        if (query) {
          const result = await geocodeAddress(query);
          if (result) {
            updates[project.id] = result;
            continue;
          }
        }
        // Fallback to city lookup
        const fallback = getCoordsFallback(project);
        if (fallback) {
          updates[project.id] = fallback;
        }
        // else: no coords — project won't show on map
      }
      if (!cancelled && Object.keys(updates).length > 0) {
        setCoords(prev => ({ ...prev, ...updates }));
      }
    };

    geocodeAll();
    return () => { cancelled = true; };
  }, [projects]);

  return coords;
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
  const { data: equipment = [] } = useEquipmentList();
  const { data: defaultEquipment } = useDefaultEquipment();
  const { data: allProjects = [] } = useAllProjects();
  const createMut = useCreateProject();
  const activeClients = clients.filter(c => c.is_active);
  const activeTechs = technicians.filter(t => t.is_active);
  const activeEquip = equipment.filter(e => e.is_active);
  const defaultTech = activeTechs.find(t => t.is_default);

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', postal_code: '', city: '',
    planned_date: '', client_id: '', technician_id: '', equipment_id: '',
    notes: '', target_value: '', housing_number: '', cable_material: '',
  });
  const [showExtra, setShowExtra] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Auto-fill defaults when sheet opens
  useEffect(() => {
    if (open && !initialized) {
      const year = new Date().getFullYear();
      const prefix = `P-${year}-`;
      const existingNumbers = allProjects
        .map(p => {
          const match = p.project_number?.match(/^P-\d{4}-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const techId = defaultTech?.id || activeTechs[0]?.id || '';
      const equipId = defaultEquipment?.id || (activeEquip.length === 1 ? activeEquip[0].id : '');
      setForm({
        project_number: `${prefix}${String(nextNum).padStart(3, '0')}`,
        project_name: '', site_name: '',
        address_line_1: '', postal_code: '', city: '',
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        client_id: '', technician_id: techId, equipment_id: equipId,
        notes: '', target_value: '', housing_number: '', cable_material: '',
      });
      setShowExtra(false);
      setInitialized(true);
    }
    if (!open) setInitialized(false);
  }, [open, initialized, allProjects, defaultTech, defaultEquipment, activeTechs, activeEquip]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.project_name.trim() || !profile?.tenant_id) return;
    try {
      await createMut.mutateAsync({
        tenant_id: profile.tenant_id,
        project_number: form.project_number,
        project_name: form.project_name,
        site_name: form.site_name || null,
        address_line_1: form.address_line_1 || null,
        postal_code: form.postal_code || null,
        city: form.city || null,
        planned_date: form.planned_date || null,
        status: 'planned' as const,
        client_id: form.client_id || null,
        technician_id: form.technician_id || null,
        equipment_id: form.equipment_id || null,
        notes: form.notes || null,
        target_value: parseFloat(form.target_value) || null,
        housing_number: form.housing_number || null,
        cable_material: form.cable_material || null,
      });
      onClose();
    } catch {}
  };

  if (!open) return null;

  const inputCls = 'w-full bg-[#F4F7FA] rounded-lg px-3.5 py-3 border-none text-[14px] font-semibold text-[#1A2E4A] outline-none focus:ring-2 focus:ring-[#E8541A] focus:ring-offset-0';
  const labelCls = 'block text-[9px] uppercase tracking-[1.5px] text-[#8098B0] font-semibold mb-1.5';
  const techName = activeTechs.find(t => t.id === form.technician_id)?.full_name;
  const equipName = activeEquip.find(e => e.id === form.equipment_id)?.device_name;
  const displayDate = form.planned_date ? format(new Date(form.planned_date), 'd MMM yyyy', { locale: nl }) : '';

  return (
    <>
      <div
        className="absolute inset-0 z-[900]"
        style={{ background: 'rgba(26,46,74,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
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
          {/* Project */}
          <div>
            <label className={labelCls}>PROJECT</label>
            <div className="flex gap-2">
              <input className={cn(inputCls, 'w-[115px] shrink-0 font-mono text-[13px]')} value={form.project_number} onChange={e => set('project_number', e.target.value)} placeholder="P-2026-001" />
              <input className={cn(inputCls, 'flex-1')} value={form.project_name} onChange={e => set('project_name', e.target.value)} placeholder="Naam van het project" />
            </div>
          </div>

          {/* Locatie */}
          <div>
            <label className={labelCls}>LOCATIE</label>
            <div className="space-y-2">
              <input className={inputCls} value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)} placeholder="Straat en huisnummer" />
              <div className="flex gap-2">
                <input className={cn(inputCls, 'w-[100px] shrink-0')} value={form.postal_code} onChange={e => set('postal_code', e.target.value)} placeholder="1234 AB" />
                <input className={cn(inputCls, 'flex-1')} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Plaats" />
              </div>
            </div>
          </div>

          {/* Datum */}
          <div>
            <label className={labelCls}>GEPLANDE DATUM</label>
            <div className="relative">
              <input type="date" className={inputCls} value={form.planned_date} onChange={e => set('planned_date', e.target.value)} />
            </div>
          </div>

          {/* Opdrachtgever */}
          <div>
            <label className={labelCls}>OPDRACHTGEVER</label>
            <ClientCombobox
              value={form.client_id}
              onChange={id => set('client_id', id)}
              clients={activeClients}
              onClientAangemaakt={() => {}}
            />
          </div>

          {/* Monteur */}
          <div>
            <label className={labelCls}>MONTEUR</label>
            <Select value={form.technician_id || '__none'} onValueChange={v => set('technician_id', v === '__none' ? '' : v)}>
              <SelectTrigger className={inputCls}>
                <span className={cn('truncate', !techName && 'text-[#8098B0]')}>
                  {techName || 'Selecteer monteur'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeTechs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}{t.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Apparaat */}
          <div>
            <label className={labelCls}>APPARAAT</label>
            <Select value={form.equipment_id || '__none'} onValueChange={v => set('equipment_id', v === '__none' ? '' : v)}>
              <SelectTrigger className={inputCls}>
                <span className={cn('truncate', !equipName && 'text-[#8098B0]')}>
                  {equipName || 'Selecteer apparaat'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen</SelectItem>
                {activeEquip.map(e => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Extra gegevens */}
          <div>
            <button
              type="button"
              onClick={() => setShowExtra(v => !v)}
              className="flex items-center justify-between w-full py-2 text-[11px] font-semibold text-[#4A6080] uppercase tracking-[1px]"
            >
              Extra gegevens
              <ChevronDown className={cn('h-4 w-4 text-[#8098B0] transition-transform', showExtra && 'rotate-180')} />
            </button>
            {showExtra && (
              <div className="space-y-3 mt-2">
                <div>
                  <label className={labelCls}>LOCATIENAAM</label>
                  <input className={inputCls} value={form.site_name} onChange={e => set('site_name', e.target.value)} placeholder="Gebouw of terrein" />
                </div>
                <div>
                  <label className={labelCls}>TOETSWAARDE (Ω)</label>
                  <input className={inputCls} inputMode="decimal" value={form.target_value} onChange={e => set('target_value', e.target.value)} placeholder="Bijv. 3.00" />
                </div>
                <div>
                  <label className={labelCls}>BEHUIZINGSNUMMER</label>
                  <input className={inputCls} value={form.housing_number} onChange={e => set('housing_number', e.target.value)} placeholder="Bijv. 12345" />
                </div>
                <div>
                  <label className={labelCls}>LEIDINGMATERIAAL</label>
                  <input className={inputCls} value={form.cable_material} onChange={e => set('cable_material', e.target.value)} placeholder="Bijv. Koper" />
                </div>
                <div>
                  <label className={labelCls}>NOTITIES</label>
                  <textarea className={cn(inputCls, 'min-h-[80px] resize-none')} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Eventuele opmerkingen" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-5 border-t border-[#EEF3F8] space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!form.project_name.trim() || createMut.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-[13px] font-bold uppercase tracking-[0.5px] transition-colors disabled:opacity-50"
            style={{ background: '#E8541A', color: 'white' }}
          >
            {createMut.isPending ? 'Aanmaken...' : 'Project aanmaken →'}
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

  // Geocode all project addresses
  const geocodedCoords = useGeocodedCoords(projects);

  const filtered = useMemo(() => {
    return projects.filter(p => filters[p.status] !== false);
  }, [projects, filters]);

  // Only show projects that have coordinates
  const mappableProjects = useMemo(() => {
    return filtered.filter(p => geocodedCoords[p.id]);
  }, [filtered, geocodedCoords]);

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
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 36 : count < 50 ? 44 : 52;
            return L.divIcon({
              html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#1A2E4A;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${size < 40 ? 13 : 15}px;border:3px solid white;box-shadow:0 4px 12px rgba(26,46,74,0.3);">${count}</div>`,
              className: '',
              iconSize: L.point(size, size),
              iconAnchor: [size / 2, size / 2],
            });
          }}
        >
          {mappableProjects.map(project => {
            const coords = geocodedCoords[project.id];
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
        </MarkerClusterGroup>
        <ZoomControls />
      </MapContainer>

      <FilterPanel filters={filters} setFilters={setFilters} visibleCount={mappableProjects.length} />
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
