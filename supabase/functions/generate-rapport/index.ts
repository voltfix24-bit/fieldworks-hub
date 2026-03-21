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
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch all data in parallel
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
        supabase
          .from("electrodes")
          .select("*")
          .eq("project_id", project_id)
          .order("sort_order"),
        supabase
          .from("pens")
          .select("*")
          .eq("project_id", project_id)
          .order("sort_order"),
        supabase
          .from("depth_measurements")
          .select("*")
          .eq("project_id", project_id)
          .order("sort_order"),
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

    // Build address
    const adres = [project.address_line_1, project.postal_code, project.city]
      .filter(Boolean)
      .join(", ");

    // Format date
    const meetdatum = session?.measurement_date
      ? new Date(session.measurement_date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : new Date().toLocaleDateString("nl-NL");

    // Build elektrodes data
    const elektrodes = electrodes.map((el, idx) => {
      const elPens = pens.filter((p) => p.electrode_id === el.id);
      const elDepths = depths.filter((d) => d.electrode_id === el.id);

      // Group measurements by pen
      const penLabels = elPens.map(
        (p) => `${p.pen_code || `Pen ${p.sort_order + 1}`} (Ω)`
      );

      // Get unique depths, build measurement rows
      const depthSet = new Set<number>();
      for (const d of elDepths) {
        depthSet.add(Number(d.depth_meters));
      }
      const sortedDepths = Array.from(depthSet).sort((a, b) => a - b);

      const metingen = sortedDepths.map((depth) => {
        const waarden = elPens.map((pen) => {
          const m = elDepths.find(
            (d) =>
              d.pen_id === pen.id && Number(d.depth_meters) === depth && Number(d.resistance_value) > 0
          );
          return m ? Number(m.resistance_value) : null;
        });
        return { diepte: depth, waarden };
      });

      // Calculate RA/RV
      const allValues = elDepths
        .map((d) => Number(d.resistance_value))
        .filter((v) => v > 0);
      const minValue = allValues.length > 0 ? Math.min(...allValues) : null;
      const targetValue = el.target_value ? Number(el.target_value) : 3.0;
      const rvOk = minValue !== null && minValue <= targetValue;

      return {
        nummer: idx + 1,
        rv: minValue !== null ? `${minValue.toFixed(2).replace(".", ",")} Ω` : "— Ω",
        norm: `${targetValue.toFixed(2).replace(".", ",")} Ω`,
        rv_ok: rvOk,
        pen_labels: penLabels.length > 0 ? penLabels : ["Pen 1 (Ω)"],
        metingen,
        // Photo URLs (not base64 for now — external API will need to handle URLs or skip)
      };
    });

    // Build the rapport payload
    const rapportData = {
      // Company info from branding
      company_name: branding?.footer_company_name || branding?.official_company_name || "Aardpen-slaan.nl",
      company_address: [branding?.footer_address, branding?.footer_postal_code, branding?.footer_city]
        .filter(Boolean)
        .join(", ") || "",
      company_email: branding?.footer_email || branding?.support_email || "",
      company_website: branding?.footer_website || branding?.website || "",
      kvk: branding?.kvk_number || "",
      certificaten: "",
      brand_color_hex: branding?.primary_color || "#F06A3F",

      // Document
      doc_nummer: `RPT-${new Date().getFullYear()}-${(project.project_number || "00000").replace(/\D/g, "").padStart(5, "0")}`,
      doc_revisie: "A — Definitief",

      // Project
      project_nr: project.project_number,
      project_naam: project.project_name,
      project_adres: adres,
      meetdatum,

      // Toetswaarde
      toetswaarde: electrodes[0]?.target_value
        ? `${Number(electrodes[0].target_value).toFixed(2).replace(".", ",")} Ω`
        : "3,00 Ω",
      gebruik_rv: electrodes.some((e) => e.is_coupled),

      // Client
      opdrachtgever_bedrijf: (client?.company_name as string) || "—",
      opdrachtgever_contact: (client?.contact_name as string) || undefined,

      // Technician
      monteur: (tech?.full_name as string) || "—",

      // Equipment
      apparaat_naam: equip
        ? [equip.brand, equip.device_name].filter(Boolean).join(" ")
        : "—",
      apparaat_serie: (equip?.serial_number as string) || "—",
      meetmethode: "3-punts aardverspreidingsweerstand",
      kalibratie_datum: equip?.calibration_date
        ? new Date(equip.calibration_date as string).toLocaleDateString("nl-NL")
        : "—",
      kalibratie_volgende: equip?.next_calibration_date
        ? new Date(equip.next_calibration_date as string).toLocaleDateString("nl-NL")
        : undefined,

      // Elektrodes
      elektrodes,
    };

    // Check if external API URL is configured
    const rapportApiUrl = Deno.env.get("RAPPORT_API_URL");

    if (rapportApiUrl) {
      // Forward to external Python API
      const apiResponse = await fetch(`${rapportApiUrl}/rapport/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rapportData),
      });

      if (!apiResponse.ok) {
        const detail = await apiResponse.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `API fout: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();

      // Build filename
      const projectClean = project.project_name.replace(/\s+/g, "_").slice(0, 30);
      const datumClean = meetdatum.replace(/-/g, "").replace(/\s/g, "").slice(0, 8);

      return new Response(
        JSON.stringify({
          pdf_base64: result.pdf_base64,
          bestandsnaam: `Aardingsrapport_${projectClean}_${datumClean}.pdf`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // No external API configured — return the prepared data for debugging
      return new Response(
        JSON.stringify({
          error: "RAPPORT_API_URL niet geconfigureerd. Stel deze secret in om PDF's te genereren.",
          prepared_data: rapportData,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
