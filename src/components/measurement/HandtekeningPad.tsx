/**
 * HandtekeningPad.tsx
 * Tekenveld voor monteur handtekening.
 * Werkt met vinger (touch) én muis (desktop).
 * Ondersteunt opslaan en hergebruiken van handtekening.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { useHandtekening } from "@/hooks/useHandtekening";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Save } from "lucide-react";

interface Props {
  /** Wordt aangeroepen zodra er een handtekening is (base64 PNG) */
  onChange?: (base64: string | null) => void;
  /** Breedte van het canvas in pixels */
  breedte?: number;
  /** Hoogte van het canvas in pixels */
  hoogte?: number;
  /** Monteur ID voor opslag per gebruiker */
  monteurId?: string;
  className?: string;
}

export default function HandtekeningPad({
  onChange,
  breedte = 500,
  hoogte = 180,
  monteurId,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tekenenRef = useRef(false);
  const heeftInhoudRef = useRef(false);
  const [heeftInhoud, setHeeftInhoud] = useState(false);
  const [toonKeuze, setToonKeuze] = useState(false);

  const {
    opgeslagenHandtekening,
    slaHandtekeningOp,
    verwijderHandtekening,
    isLoading,
  } = useHandtekening();

  // ── Canvas context helpers ──
  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  };

  const getCanvasPunt = (
    e: MouseEvent | Touch,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // ── Teken handlers ──
  const startTekenen = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;

      tekenenRef.current = true;
      const punt =
        "touches" in e
          ? getCanvasPunt(e.touches[0], canvas)
          : getCanvasPunt(e as MouseEvent, canvas);
      ctx.beginPath();
      ctx.moveTo(punt.x, punt.y);
    },
    []
  );

  const tekeningVoortgang = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!tekenenRef.current) return;
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;

      const punt =
        "touches" in e
          ? getCanvasPunt(e.touches[0], canvas)
          : getCanvasPunt(e as MouseEvent, canvas);
      ctx.lineTo(punt.x, punt.y);
      ctx.stroke();

      if (!heeftInhoudRef.current) {
        heeftInhoudRef.current = true;
        setHeeftInhoud(true);
      }
    },
    []
  );

  const stopTekenen = useCallback(() => {
    if (!tekenenRef.current) return;
    tekenenRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas || !heeftInhoudRef.current) return;

    const base64 = canvas.toDataURL("image/png").split(",")[1];
    onChange?.(base64);
  }, [onChange]);

  // ── Event listeners ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", startTekenen, { passive: false });
    canvas.addEventListener("mousemove", tekeningVoortgang, { passive: false });
    canvas.addEventListener("mouseup", stopTekenen);
    canvas.addEventListener("mouseleave", stopTekenen);
    canvas.addEventListener("touchstart", startTekenen, { passive: false });
    canvas.addEventListener("touchmove", tekeningVoortgang, { passive: false });
    canvas.addEventListener("touchend", stopTekenen);

    return () => {
      canvas.removeEventListener("mousedown", startTekenen);
      canvas.removeEventListener("mousemove", tekeningVoortgang);
      canvas.removeEventListener("mouseup", stopTekenen);
      canvas.removeEventListener("mouseleave", stopTekenen);
      canvas.removeEventListener("touchstart", startTekenen);
      canvas.removeEventListener("touchmove", tekeningVoortgang);
      canvas.removeEventListener("touchend", stopTekenen);
    };
  }, [startTekenen, tekeningVoortgang, stopTekenen]);

  // ── Canvas initialisatie ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── Acties ──
  const leegMaken = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    heeftInhoudRef.current = false;
    setHeeftInhoud(false);
    onChange?.(null);
  };

  const laadOpgeslagen = () => {
    if (!opgeslagenHandtekening) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      heeftInhoudRef.current = true;
      setHeeftInhoud(true);
      const base64 = canvas.toDataURL("image/png").split(",")[1];
      onChange?.(base64);
    };
    img.src = `data:image/png;base64,${opgeslagenHandtekening}`;
    setToonKeuze(false);
  };

  const opslaanEnDoorgaan = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !heeftInhoudRef.current) return;
    const base64 = canvas.toDataURL("image/png").split(",")[1];
    await slaHandtekeningOp(base64);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={breedte}
          height={hoogte}
          className="w-full touch-none cursor-crosshair block"
          style={{ aspectRatio: `${breedte} / ${hoogte}` }}
        />
        {/* Placeholder tekst als leeg */}
        {!heeftInhoud && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-muted-foreground text-sm select-none">
              Teken hier uw handtekening
            </span>
          </div>
        )}
        {/* Onderlijn — visuele gids */}
        <div
          className="absolute bottom-8 left-6 right-6 border-b border-border"
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* Knoppen rij */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Links: wissen */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={leegMaken}
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Wissen
        </Button>

        {/* Rechts: opgeslagen handtekening + opslaan */}
        <div className="flex items-center gap-2">
          {/* Hergebruik opgeslagen handtekening */}
          {opgeslagenHandtekening && (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setToonKeuze((v) => !v)}
                className="text-primary border-primary/25 hover:bg-primary/5"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Gebruik opgeslagen
              </Button>

              {/* Dropdown */}
              {toonKeuze && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-popover rounded-xl shadow-lg border border-border overflow-hidden z-10">
                  <div className="p-3 border-b border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Opgeslagen handtekening
                    </p>
                    <img
                      src={`data:image/png;base64,${opgeslagenHandtekening}`}
                      alt="Opgeslagen handtekening"
                      className="w-full h-16 object-contain bg-muted rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={laadOpgeslagen}
                      className="px-4 py-3 text-sm text-left text-foreground hover:bg-muted transition-colors"
                    >
                      Gebruik deze handtekening
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        verwijderHandtekening();
                        setToonKeuze(false);
                      }}
                      className="px-4 py-3 text-sm text-left text-destructive hover:bg-destructive/5 transition-colors border-t border-border/50"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opslaan voor later */}
          {heeftInhoud && !opgeslagenHandtekening && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={opslaanEnDoorgaan}
              disabled={isLoading}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isLoading ? "Opslaan..." : "Opslaan voor later"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
