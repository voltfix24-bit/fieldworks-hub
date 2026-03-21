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
    const { project_id, handtekening_b64, recipient_email, recipient_name } =
      await req.json();

    if (!project_id || !recipient_email) {
      return new Response(
        JSON.stringify({ error: "project_id en recipient_email zijn vereist" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // 1. Generate rapport via the existing edge function
    const rapportRes = await fetch(
      `${supabaseUrl}/functions/v1/generate-rapport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ project_id, handtekening_b64 }),
      }
    );

    if (!rapportRes.ok) {
      const errText = await rapportRes.text();
      throw new Error(`Rapport generatie mislukt: ${errText}`);
    }

    const rapportData = await rapportRes.json();

    if (!rapportData.pdf_base64) {
      throw new Error("Geen PDF ontvangen van rapport generator");
    }

    // 2. Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is niet geconfigureerd");
    }

    const bestandsnaam = rapportData.bestandsnaam || `Aardingsrapport_${project_id}.pdf`;
    const fromEmail = Deno.env.get("RAPPORT_FROM_EMAIL") || "rapporten@aardpen-slaan.nl";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipient_email,
        subject: `Aardingsrapport — ${bestandsnaam.replace('.pdf', '')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-size: 15px; color: #333;">Geachte ${recipient_name || ""},</p>
            <p style="font-size: 15px; color: #333; line-height: 1.6;">
              Hierbij ontvangt u het aardingsrapport als bijlage.
            </p>
            <p style="font-size: 15px; color: #333; margin-top: 24px;">Met vriendelijke groet</p>
          </div>
        `,
        attachments: [
          {
            filename: bestandsnaam,
            content: rapportData.pdf_base64,
          },
        ],
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      throw new Error(`E-mail versturen mislukt [${emailRes.status}]: ${errBody}`);
    }

    return new Response(
      JSON.stringify({ success: true, bestandsnaam }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-rapport error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
