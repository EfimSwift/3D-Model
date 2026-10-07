type Props = {
  src: string;
  alt: string;
  variant?: "card" | "detail";
};

export function ProductShowcaseImage({ src, alt, variant = "card" }: Props) {
  const pad = variant === "detail" ? "p-10" : "p-6";

  return (
    <div className={`flex h-full w-full items-end justify-center ${pad}`}>
      <div
        className="studio-showcase-float relative w-[78%] max-w-[280px]"
        style={{ animationDuration: variant === "detail" ? "6s" : "5.5s" }}
      >
        <div
          className="absolute -bottom-3 left-[10%] right-[10%] h-4 rounded-[100%] bg-black/50 blur-md"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="relative z-[1] w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
        />
      </div>
    </div>
  );
}
