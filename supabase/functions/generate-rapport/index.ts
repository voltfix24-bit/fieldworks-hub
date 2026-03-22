import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, handtekening_b64 } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const [projectRes, sessionRes, electrodesRes, pensRes, depthsRes, brandingRes] =
      await Promise.all([
        supabase
          .from("projects")
          .select("*, clients(*), technicians(*), equipment(*)")
          .eq("id", project_id)
          .single(),
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
        supabase.from("tenant_branding").select("*").limit(1).maybeSingle(),
      ]);

    if (projectRes.error) throw projectRes.error;
    if (!projectRes.data) throw new Error("Project niet gevonden");

    const project = projectRes.data;
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

      // Pass URLs directly — Python API downloads them itself
      const fotoDisplayUrl = elPens.find((p) => p.display_photo_url)?.display_photo_url || null;
      const fotoOverzichtUrl = elPens.find((p) => p.overview_photo_url)?.overview_photo_url || null;

      return {
        nummer: idx + 1,
        code: el.electrode_code || `Elektrode ${idx + 1}`,
        notes: el.notes || null,
        ra: isRv ? undefined : eindwaarde,
        rv: isRv ? eindwaarde : undefined,
        norm: `${targetValue.toFixed(2).replace(".", ",")} Ω`,
        rv_ok: rvOk,
        pen_labels: penLabels.length > 0 ? penLabels : ["Pen 1 (Ω)"],
        pennen_gekoppeld: gekoppeld,
        metingen,
        foto_display_url: fotoDisplayUrl,
        foto_overzicht_url: fotoOverzichtUrl,
      };
    });

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
      certificaten: "",
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
      apparaat_serie: (equip?.serial_number as string) || null,
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

    let rapportApiUrl = Deno.env.get("RAPPORT_API_URL");

    if (rapportApiUrl) {
      if (!rapportApiUrl.startsWith("http://") && !rapportApiUrl.startsWith("https://")) {
        rapportApiUrl = `https://${rapportApiUrl}`;
      }
      rapportApiUrl = rapportApiUrl.replace(/\/+$/, "");

      const apiResponse = await fetch(`${rapportApiUrl}/rapport/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rapportData),
      });

      if (!apiResponse.ok) {
        const detailText = await apiResponse.text().catch(() => "");
        let detailMsg = `API fout: ${apiResponse.status}`;
        try {
          const parsed = JSON.parse(detailText);
          detailMsg = typeof parsed?.detail === "string"
            ? parsed.detail
            : JSON.stringify(parsed?.detail ?? parsed).slice(0, 500);
        } catch { /* use default */ }
        throw new Error(detailMsg);
      }

      const result = await apiResponse.json();
      const projectClean = project.project_name.replace(/\s+/g, "_").slice(0, 30);
      const datumClean = meetdatum.replace(/-/g, "").replace(/\s/g, "").slice(0, 8);

      return new Response(
        JSON.stringify({
          pdf_base64: result.pdf_base64,
          bestandsnaam: `Aardingsrapport_${projectClean}_${datumClean}.pdf`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ prepared_data: rapportData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    console.error("generate-rapport error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
