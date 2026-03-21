import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { logoUrl, tenantId, variant } = await req.json();
    if (!logoUrl || !tenantId || !variant) {
      return new Response(JSON.stringify({ error: "Missing logoUrl, tenantId, or variant" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompts: Record<string, string> = {
      compact: "Extract only the icon, symbol, or monogram from this logo. Remove any text, tagline, or wordmark. Keep only the graphical mark. Output it centered on a transparent background, suitable for use as a small app icon or favicon. If the logo has no distinct icon element, create a clean monogram from the first letter(s). Maintain the exact same colors and style.",
      dark: "Create a version of this logo optimized for dark backgrounds. Invert or lighten the colors so it has strong contrast and readability on a dark/black background. Keep the exact same shape, layout and proportions. Use white or light-colored elements where the original uses dark colors. Maintain brand recognition. Output on a transparent background.",
      light: "Create a version of this logo optimized for light/white backgrounds. Ensure it has strong contrast and readability on light backgrounds. If it already works on light backgrounds, refine it slightly for maximum clarity. Keep the exact same shape, layout and proportions. Use dark or saturated elements. Maintain brand recognition. Output on a transparent background.",
    };

    const prompt = prompts[variant];
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown variant: ${variant}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI gateway to edit the image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: logoUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      return new Response(JSON.stringify({ error: "AI could not generate a variant for this logo", unsupported: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert base64 to file and upload to storage
    const base64Match = generatedImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Unexpected image format from AI");

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const imageBytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const path = `${tenantId}/${variant}_logo_${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await sb.storage
      .from("tenant-assets")
      .upload(path, imageBytes, { contentType: `image/${ext}`, upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sb.storage.from("tenant-assets").getPublicUrl(path);

    return new Response(JSON.stringify({ url: publicUrl, variant }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
