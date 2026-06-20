import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

const MEASUREMENT_BUCKET = "measurement-photos";

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[],
    );
  }
  return btoa(binary);
}

/**
 * Extract the storage path inside `measurement-photos` from either a
 * legacy public URL or a storage path stored in the DB.
 */
function extractPhotoPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith("http")) return stored.replace(/^\/+/, "");
  const m1 = `/storage/v1/object/public/${MEASUREMENT_BUCKET}/`;
  const m2 = `/storage/v1/object/sign/${MEASUREMENT_BUCKET}/`;
  let idx = stored.indexOf(m1);
  if (idx !== -1) return stored.slice(idx + m1.length);
  idx = stored.indexOf(m2);
  if (idx !== -1) return stored.slice(idx + m2.length).split("?")[0];
  return null;
}

/**
 * Download a measurement photo via the service-role client and return
 * pure base64. Returns null on failure.
 */
async function photoToBase64(
  // deno-lint-ignore no-explicit-any
  sbAdmin: any,
  stored: string | null | undefined,
  expectedTenantId: string,
): Promise<string | null> {
  const path = extractPhotoPath(stored);
  if (!path) return null;
  // Defence in depth: only allow paths inside the project's tenant folder.
  const firstSegment = path.split("/")[0];
  if (firstSegment !== expectedTenantId) return null;
  try {
    const { data, error } = await sbAdmin.storage
      .from(MEASUREMENT_BUCKET)
      .download(path);
    if (error || !data) return null;
    const buf = await data.arrayBuffer();
    return bytesToBase64(new Uint8Array(buf));
  } catch {
    return null;
  }
}

// ───── In-edge PDF renderer (pdf-lib, no external service) ─────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return { r: 0.94, g: 0.41, b: 0.25 };
  return { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255 };
}

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function tryEmbedImage(pdf: PDFDocument, b64?: string | null) {
  if (!b64) return null;
  try {
    const bytes = b64ToBytes(b64);
    // pdf-lib accepts PNG and JPG. Try JPG first, then PNG.
    try { return await pdf.embedJpg(bytes); } catch { /* fall through */ }
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

// deno-lint-ignore no-explicit-any
async function renderPdf(data: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = hexToRgb(data.brand_color_hex || "#F06A3F");
  const ink = rgb(0.1, 0.1, 0.12);
  const mute = rgb(0.45, 0.45, 0.5);
  const line = rgb(0.85, 0.85, 0.87);

  const A4 = { w: 595.28, h: 841.89 };
  const M = 40;
  let page = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;

  const ensure = (need: number) => {
    if (y - need < M) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - M;
    }
  };

  // Helvetica WinAnsi kan geen Ω/em-dash etc.; vervang door ASCII-safe varianten.
  const sanitize = (s: string) =>
    String(s ?? "")
      .replace(/\u03A9/g, "Ohm")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u00B7/g, "-")
      .replace(/[^\x00-\xFF]/g, "?");

  const text = (s: string, x: number, opts: { size?: number; b?: boolean; color?: any; y?: number } = {}) => {
    const size = opts.size ?? 10;
    page.drawText(sanitize(s), { x, y: opts.y ?? y, size, font: opts.b ? bold : font, color: opts.color ?? ink });
  };

  const wrap = (s: string, maxChars: number) => {
    const words = (s || "").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // ── HEADER ─────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: A4.h - 70, width: A4.w, height: 70, color: rgb(brand.r, brand.g, brand.b) });
  text(data.company_name || "Aardingsrapport", M, { y: A4.h - 38, size: 16, b: true, color: rgb(1, 1, 1) });
  text("Aardingsmeting — meetrapport", M, { y: A4.h - 55, size: 10, color: rgb(1, 1, 1) });
  text(`${data.doc_nummer || ""}`, A4.w - M - 120, { y: A4.h - 38, size: 9, color: rgb(1, 1, 1) });
  text(`Meetdatum: ${data.meetdatum || "—"}`, A4.w - M - 120, { y: A4.h - 55, size: 9, color: rgb(1, 1, 1) });
  y = A4.h - 90;

  // ── PROJECT TITLE ─────────────────────────────────────
  text(data.project_naam || "—", M, { size: 14, b: true });
  y -= 16;
  text(`${data.project_nr || ""}  ·  ${data.project_adres || ""}`, M, { size: 10, color: mute });
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.5, color: line });
  y -= 14;

  // ── INFO GRID 2 columns ───────────────────────────────
  const colW = (A4.w - M * 2 - 20) / 2;
  const block = (title: string, rows: [string, string | null | undefined][], col: 0 | 1) => {
    const x = M + col * (colW + 20);
    let by = y;
    page.drawText(sanitize(title.toUpperCase()), { x, y: by, size: 8, font: bold, color: rgb(brand.r, brand.g, brand.b) });
    by -= 11;
    for (const [k, v] of rows) {
      if (!v) continue;
      page.drawText(sanitize(k), { x, y: by, size: 8.5, font, color: mute });
      const lines = wrap(String(v), 38);
      for (let i = 0; i < lines.length; i++) {
        page.drawText(sanitize(lines[i]), { x: x + 78, y: by - i * 11, size: 9, font: bold, color: ink });
      }
      by -= 11 * Math.max(1, lines.length) + 2;
    }
    return by;
  };

  ensure(160);
  const leftBottom = block("Projectgegevens", [
    ["Projectnummer", data.project_nr],
    ["Locatie", data.locatienaam],
    ["Toetswaarde", data.toetswaarde],
    ["Behuizing", data.behuizingsnummer],
    ["Leidingmateriaal", data.leidingmateriaal],
  ], 0);
  const rightBottom = block("Opdrachtgever", [
    ["Bedrijf", data.opdrachtgever_bedrijf],
    ["Contact", data.opdrachtgever_contact],
  ], 1);
  y = Math.min(leftBottom, rightBottom) - 8;

  ensure(120);
  const leftBottom2 = block("Monteur", [
    ["Naam", data.monteur],
  ], 0);
  const rightBottom2 = block("Meetapparatuur", [
    ["Apparaat", data.apparaat_naam],
    ["Serienummer", data.apparaat_serie],
    ["Kalibratie", data.kalibratie_datum],
    ["Volgende kal.", data.kalibratie_volgende],
  ], 1);
  y = Math.min(leftBottom2, rightBottom2) - 14;

  if (data.meetnotities) {
    ensure(40);
    text("OPMERKINGEN", M, { size: 8, b: true, color: rgb(brand.r, brand.g, brand.b) });
    y -= 12;
    for (const ln of wrap(String(data.meetnotities), 95)) {
      ensure(12);
      text(ln, M, { size: 9 });
      y -= 11;
    }
    y -= 6;
  }

  // ── ELEKTRODES ─────────────────────────────────────────
  ensure(20);
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.5, color: line });
  y -= 14;
  text("MEETRESULTATEN", M, { size: 9, b: true, color: rgb(brand.r, brand.g, brand.b) });
  y -= 16;

  for (const el of (data.elektrodes || [])) {
    ensure(80);
    // Title row
    text(`${el.code || `Elektrode ${el.nummer}`}`, M, { size: 11, b: true });
    const eindwaarde = el.rv || el.ra || "—";
    const okColor = el.rv_ok ? rgb(0.10, 0.55, 0.30) : rgb(0.75, 0.20, 0.20);
    text(`Eindwaarde: ${eindwaarde}`, A4.w - M - 180, { size: 10, b: true, color: okColor });
    text(`Norm: ${el.norm || "—"}`, A4.w - M - 60, { size: 9, color: mute });
    y -= 14;

    // Measurement table
    const pens: string[] = el.pen_labels || ["Pen 1 (Ω)"];
    const colCount = pens.length + 1; // diepte + pens
    const tableW = A4.w - M * 2;
    const cw = tableW / colCount;

    ensure(20);
    page.drawRectangle({ x: M, y: y - 14, width: tableW, height: 16, color: rgb(0.96, 0.96, 0.98) });
    text("Diepte (m)", M + 4, { size: 8.5, b: true, y: y - 10 });
    pens.forEach((p, i) => text(p, M + cw * (i + 1) + 4, { size: 8.5, b: true, y: y - 10 }));
    y -= 18;

    for (const m of (el.metingen || [])) {
      ensure(14);
      text(String(m.diepte).replace(".", ","), M + 4, { size: 9 });
      (m.waarden || []).forEach((w: number | null, i: number) => {
        const v = w == null ? "—" : `${Number(w).toFixed(2).replace(".", ",")}`;
        text(v, M + cw * (i + 1) + 4, { size: 9 });
      });
      y -= 12;
      page.drawLine({ start: { x: M, y: y + 4 }, end: { x: A4.w - M, y: y + 4 }, thickness: 0.25, color: line });
    }

    if (el.notes) {
      ensure(20);
      for (const ln of wrap(`Notitie: ${el.notes}`, 95)) {
        text(ln, M, { size: 8.5, color: mute });
        y -= 10;
      }
    }

    // Photos
    const fotos: Array<{ label: string; b64?: string | null }> = [
      { label: "Display", b64: el.foto_display_b64 },
      { label: "Overzicht", b64: el.foto_overzicht_b64 },
    ].filter((f) => f.b64) as any;
    if (fotos.length > 0) {
      ensure(140);
      const fW = (A4.w - M * 2 - 10) / 2;
      const fH = 110;
      for (let i = 0; i < fotos.length; i++) {
        const img = await tryEmbedImage(pdf, fotos[i].b64);
        if (!img) continue;
        const dims = img.scaleToFit(fW, fH);
        const xPos = M + i * (fW + 10);
        page.drawImage(img, { x: xPos, y: y - fH, width: dims.width, height: dims.height });
        text(fotos[i].label, xPos, { size: 8, color: mute, y: y - fH - 10 });
      }
      y -= fH + 18;
    }

    y -= 8;
  }

  // ── SIGNATURE ───────────────────────────────────────────
  if (data.handtekening_b64) {
    ensure(90);
    text("ONDERTEKENING", M, { size: 8, b: true, color: rgb(brand.r, brand.g, brand.b) });
    y -= 12;
    const sig = await tryEmbedImage(pdf, data.handtekening_b64);
    if (sig) {
      const d = sig.scaleToFit(180, 60);
      page.drawImage(sig, { x: M, y: y - 60, width: d.width, height: d.height });
    }
    y -= 64;
    page.drawLine({ start: { x: M, y }, end: { x: M + 200, y }, thickness: 0.5, color: line });
    y -= 12;
    text(`${data.monteur || "Uitvoerder"}  ·  ${data.meetdatum || ""}`, M, { size: 9, color: mute });
  }

  // ── FOOTER on every page ─────────────────────────────
  const pageCount = pdf.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = pdf.getPage(i);
    p.drawLine({ start: { x: M, y: 30 }, end: { x: A4.w - M, y: 30 }, thickness: 0.4, color: line });
    p.drawText(`${data.company_name || ""}  ·  ${data.company_email || ""}  ·  ${data.company_website || ""}`,
      { x: M, y: 18, size: 7.5, font, color: mute });
    p.drawText(`Pagina ${i + 1} / ${pageCount}`, { x: A4.w - M - 60, y: 18, size: 7.5, font, color: mute });
  }

  return await pdf.save();
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const project_id = typeof body.project_id === "string" ? body.project_id : null;
    const handtekening_b64 =
      typeof body.handtekening_b64 === "string" ? body.handtekening_b64 : undefined;

    if (!project_id || !/^[0-9a-f-]{32,40}$/i.test(project_id)) {
      return jsonResponse({ error: "Geldig project_id is vereist" }, 400);
    }

    // ─── Auth check ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Niet geauthenticeerd" }, 401);
    }
    const token = authHeader.slice("Bearer ".length);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return jsonResponse({ error: "Ongeldige sessie" }, 401);
    }
    const userId = userData.user.id;

    // Service-role client for storage downloads (private bucket)
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: max 10 per minute per user
    const { data: rlOk } = await sbAdmin.rpc("check_rate_limit", {
      _user_id: userId,
      _function_name: "generate-rapport",
      _max_per_minute: 10,
    });
    if (rlOk === false) {
      return jsonResponse({ error: "Te veel verzoeken. Probeer over een minuut opnieuw." }, 429);
    }



    // Look up the user's tenant
    const { data: profile, error: profileError } = await sbAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile?.tenant_id) {
      return jsonResponse({ error: "Geen tenant gevonden voor gebruiker" }, 403);
    }
    const userTenantId = profile.tenant_id as string;

    // Fetch project via user-scoped client → RLS enforces tenant access
    const projectRes = await supabase
      .from("projects")
      .select("*, clients(*), technicians(*), equipment(*)")
      .eq("id", project_id)
      .maybeSingle();

    if (projectRes.error) throw projectRes.error;
    if (!projectRes.data) {
      return jsonResponse({ error: "Project niet gevonden of geen toegang" }, 404);
    }

    const project = projectRes.data;
    if (project.tenant_id !== userTenantId) {
      return jsonResponse({ error: "Geen toegang tot dit project" }, 403);
    }
    const tenantId = project.tenant_id;

    const [sessionRes, electrodesRes, pensRes, depthsRes, brandingRes] =
      await Promise.all([
        supabase
          .from("project_measurement_sessions")
          .select("*")
          .eq("project_id", project_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("electrodes").select("*").eq("project_id", project_id).order("sort_order"),
        supabase.from("pens").select("*").eq("project_id", project_id).order("sort_order"),
        supabase.from("depth_measurements").select("*").eq("project_id", project_id).order("sort_order"),
        supabase.from("tenant_branding").select("*").eq("tenant_id", tenantId).maybeSingle(),
      ]);

    const session = sessionRes.data;
    const electrodes = electrodesRes.data || [];
    const pens = pensRes.data || [];
    const depths = depthsRes.data || [];
    const branding = brandingRes.data;

    const client = project.clients as Record<string, unknown> | null;
    const tech = project.technicians as Record<string, unknown> | null;
    const equip = project.equipment as Record<string, unknown> | null;

    const adres = [project.address_line_1, project.postal_code, project.city]
      .filter(Boolean)
      .join(", ");

    const meetdatum = session?.measurement_date
      ? new Date(session.measurement_date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : new Date().toLocaleDateString("nl-NL");

    // Build elektrodes — pass photo URLs instead of base64 to avoid memory limits
    const elektrodes = electrodes.map((el, idx) => {
      const elPens = pens.filter((p) => p.electrode_id === el.id);
      const elDepths = depths.filter((d) => d.electrode_id === el.id);

      const penLabels = elPens.map(
        (p) => `${p.pen_code || `Pen ${p.sort_order + 1}`} (Ω)`
      );

      const depthSet = new Set<number>();
      for (const d of elDepths) {
        depthSet.add(Number(d.depth_meters));
      }
      const sortedDepths = Array.from(depthSet).sort((a, b) => a - b);

      const metingen = sortedDepths.map((depth) => {
        const waarden = elPens.map((pen) => {
          const m = elDepths.find(
            (d) =>
              d.pen_id === pen.id &&
              Number(d.depth_meters) === depth &&
              Number(d.resistance_value) > 0
          );
          return m ? Number(m.resistance_value) : null;
        });
        return { diepte: depth, waarden };
      });

      const targetValue = el.target_value ? Number(el.target_value) : 3.0;

      const aantalPennen = elPens.length;
      const gekoppeld = el.is_coupled ?? (aantalPennen >= 2);
      const isRv = aantalPennen >= 2 && gekoppeld;

      let eindwaarde: string;
      let rvOk: boolean;

      if (isRv) {
        const rvVal = el.rv_value ? Number(el.rv_value) : null;
        eindwaarde = rvVal !== null
          ? `${rvVal.toFixed(2).replace(".", ",")} Ω`
          : "— Ω";
        rvOk = rvVal !== null && rvVal <= targetValue;
      } else {
        const allValues = elDepths
          .map((d) => Number(d.resistance_value))
          .filter((v) => v > 0);
        const minValue = allValues.length > 0 ? Math.min(...allValues) : null;
        eindwaarde = minValue !== null
          ? `${minValue.toFixed(2).replace(".", ",")} Ω`
          : "— Ω";
        rvOk = minValue !== null && minValue <= targetValue;
      }

      const fotoDisplayUrl = elPens.find((p) => p.display_photo_url)?.display_photo_url || null;
      const fotoOverzichtUrl = elPens.find((p) => p.overview_photo_url)?.overview_photo_url || null;

      return {
        nummer: idx + 1,
        code: el.electrode_code || `Elektrode ${idx + 1}`,
        notes: el.notes || null,
        ra: isRv ? "" : eindwaarde,
        rv: isRv ? eindwaarde : "",
        norm: `${targetValue.toFixed(2).replace(".", ",")} Ω`,
        rv_ok: rvOk,
        pen_labels: penLabels.length > 0 ? penLabels : ["Pen 1 (Ω)"],
        pennen_gekoppeld: gekoppeld,
        metingen,
        foto_display_url: fotoDisplayUrl,
        foto_overzicht_url: fotoOverzichtUrl,
        // Will be populated below
        foto_display_b64: null as string | null,
        foto_overzicht_b64: null as string | null,
      };
    });

    // Download photos via service role from the private bucket and base64-encode sequentially
    for (const el of elektrodes) {
      if (el.foto_display_url) {
        el.foto_display_b64 = await photoToBase64(sbAdmin, el.foto_display_url, tenantId);
      }
      if (el.foto_overzicht_url) {
        el.foto_overzicht_b64 = await photoToBase64(sbAdmin, el.foto_overzicht_url, tenantId);
      }
    }

    const projectTargetValue = (project as any).target_value
      ? Number((project as any).target_value)
      : electrodes[0]?.target_value
        ? Number(electrodes[0].target_value)
        : 3.0;

    const rapportData = {
      company_name: branding?.footer_company_name || branding?.official_company_name || "Aardpen-slaan.nl",
      company_address: [branding?.footer_address, branding?.footer_postal_code, branding?.footer_city]
        .filter(Boolean)
        .join(", ") || "",
      company_email: branding?.footer_email || branding?.support_email || "",
      company_website: branding?.footer_website || branding?.website || "",
      kvk: branding?.kvk_number || "",
      certificaten: (branding as any)?.certificaten || "",
      brand_color_hex: branding?.primary_color || "#F06A3F",

      doc_nummer: `RPT-${new Date().getFullYear()}-${(project.project_number || "00000").replace(/\D/g, "").padStart(5, "0")}`,
      doc_revisie: "A — Definitief",

      project_nr: project.project_number,
      project_naam: project.project_name,
      project_adres: adres,
      meetdatum,

      toetswaarde: `${projectTargetValue.toFixed(2).replace(".", ",")} Ω`,

      locatienaam: project.site_name || null,
      behuizingsnummer: (project as any).housing_number || null,
      leidingmateriaal: (project as any).cable_material || null,
      meetnotities: session?.measurement_notes || null,

      opdrachtgever_bedrijf: (client?.company_name as string) || null,
      opdrachtgever_contact: (client?.contact_name as string) || null,

      monteur: (tech?.full_name as string) || "—",

      apparaat_naam: equip
        ? [equip.brand, equip.device_name].filter(Boolean).join(" ")
        : "—",
      apparaat_serie: (equip?.serial_number as string) || "",
      meetmethode: "3-punts aardverspreidingsweerstand",
      kalibratie_datum: equip?.calibration_date
        ? new Date(equip.calibration_date as string).toLocaleDateString("nl-NL")
        : null,
      kalibratie_volgende: equip?.next_calibration_date
        ? new Date(equip.next_calibration_date as string).toLocaleDateString("nl-NL")
        : null,

      handtekening_b64: handtekening_b64 || undefined,

      elektrodes,
    };

    // Render PDF in-edge using pdf-lib (geen externe service nodig)
    const pdfBytes = await renderPdf(rapportData);
    const pdfBase64 = bytesToBase64(pdfBytes);
    const projectClean = (project.project_name || "rapport").replace(/\s+/g, "_").slice(0, 30);
    const datumClean = (meetdatum || "").replace(/[^0-9]/g, "").slice(0, 8);
    return jsonResponse({
      pdf_base64: pdfBase64,
      bestandsnaam: `Aardingsrapport_${projectClean}_${datumClean}.pdf`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    console.error("generate-rapport error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
