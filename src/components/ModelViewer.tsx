"use client";

import { createElement, useEffect, useRef, useState } from "react";

type Variant = "card" | "preview";

type Props = {
  src: string;
  poster?: string;
  alt: string;
  variant: Variant;
};

type ModelViewerEl = HTMLElement & {
  autoRotate?: boolean;
};

export function ModelViewer({ src, poster, alt, variant }: Props) {
  const ref = useRef<ModelViewerEl | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || variant !== "preview") return;

    const stopOnDrag = () => {
      el.autoRotate = false;
      setAutoRotate(false);
    };

    el.addEventListener("pointerdown", stopOnDrag);
    return () => el.removeEventListener("pointerdown", stopOnDrag);
  }, [variant, src]);

  useEffect(() => {
    const el = ref.current;
    if (el) el.autoRotate = autoRotate;
  }, [autoRotate]);

  const isCard = variant === "card";

  return (
    <div className="relative h-full w-full">
      {createElement("model-viewer", {
        ref,
        src,
        poster,
        alt,
        "camera-controls": !isCard,
        "auto-rotate": autoRotate,
        "rotation-per-second": "30deg",
        "disable-zoom": isCard,
        "disable-pan": isCard,
        "touch-action": isCard ? "none" : "pan-y",
        "interaction-prompt": isCard ? "none" : "auto",
        "shadow-intensity": "1",
        exposure: "1",
        className: "h-full w-full bg-transparent",
        style: {
          width: "100%",
          height: "100%",
          minHeight: isCard ? undefined : "360px",
          pointerEvents: isCard ? "none" : "auto",
        },
      })}
      {variant === "preview" && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
          <p className="studio-badge rounded-full px-3 py-1 text-xs text-studio-muted">
            Зажмите ЛКМ и вращайте. Автовращение останавливается при взаимодействии.
          </p>
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className="studio-btn-ghost rounded-full px-3 py-1 text-xs font-medium"
          >
            {autoRotate ? "Остановить вращение" : "Включить вращение"}
          </button>
        </div>
      )}
    </div>
  );
}
