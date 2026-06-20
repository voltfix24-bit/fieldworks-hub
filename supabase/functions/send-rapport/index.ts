import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f-]{32,40}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Niet geauthenticeerd" }, 401);
    }
    const token = authHeader.slice("Bearer ".length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Ongeldige sessie" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // ─── Payload validation ───────────────────────────────
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const project_id = typeof body.project_id === "string" ? body.project_id : "";
    const recipient_email = typeof body.recipient_email === "string" ? body.recipient_email.trim() : "";
    const recipient_name =
      typeof body.recipient_name === "string" ? body.recipient_name.slice(0, 200) : "";
    const handtekening_b64 =
      typeof body.handtekening_b64 === "string" ? body.handtekening_b64 : undefined;

    if (!UUID_RE.test(project_id)) {
      return jsonResponse({ error: "Geldig project_id is vereist" }, 400);
    }
    if (!EMAIL_RE.test(recipient_email) || recipient_email.length > 320) {
      return jsonResponse({ error: "Geldig recipient_email is vereist" }, 400);
    }

    // ─── Tenant check: caller must own this project ──────
    const sbAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: profile }, { data: project }] = await Promise.all([
      sbAdmin.from("profiles").select("tenant_id").eq("id", userId).maybeSingle(),
      sbAdmin.from("projects").select("tenant_id").eq("id", project_id).maybeSingle(),
    ]);
    if (!profile?.tenant_id || !project?.tenant_id || profile.tenant_id !== project.tenant_id) {
      return jsonResponse({ error: "Geen toegang tot dit project" }, 403);
    }

    // ─── Generate PDF via the rapport function ──────────
    const rapportRes = await fetch(`${supabaseUrl}/functions/v1/generate-rapport`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ project_id, handtekening_b64 }),
    });
    if (!rapportRes.ok) {
      const errText = await rapportRes.text();
      throw new Error(`Rapport generatie mislukt: ${errText.slice(0, 300)}`);
    }
    const rapportData = await rapportRes.json();
    if (!rapportData.pdf_base64) {
      throw new Error("Geen PDF ontvangen van rapport generator");
    }

    // ─── Send email via Resend ──────────────────────────
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is niet geconfigureerd");

    const bestandsnaam = rapportData.bestandsnaam || `Aardingsrapport_${project_id}.pdf`;
    const fromEmail = Deno.env.get("RAPPORT_FROM_EMAIL") || "rapporten@aardpen-slaan.nl";

    const safeName = recipient_name.replace(/[<>]/g, "");
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: recipient_email,
        subject: `Aardingsrapport — ${bestandsnaam.replace(".pdf", "")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-size: 15px; color: #333;">Geachte ${safeName || ""},</p>
            <p style="font-size: 15px; color: #333; line-height: 1.6;">
              Hierbij ontvangt u het aardingsrapport als bijlage.
            </p>
            <p style="font-size: 15px; color: #333; margin-top: 24px;">Met vriendelijke groet</p>
          </div>
        `,
        attachments: [{ filename: bestandsnaam, content: rapportData.pdf_base64 }],
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      throw new Error(`E-mail versturen mislukt [${emailRes.status}]: ${errBody.slice(0, 300)}`);
    }

    return jsonResponse({ success: true, bestandsnaam });
  } catch (err) {
    console.error("send-rapport error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Onbekende fout" },
      500,
    );
  }
});
