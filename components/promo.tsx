import type { MouseEvent } from "react";
import { CASTER_IMAGE, CASTER_URL } from "@/lib/site";
import { CasterIcon } from "./icons";

export default function Promo({ onNavigate }: { onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <section className="promo" aria-label="Featured mod">
      <div className="promo-head">
        <CasterIcon className="btn-icon" width={14} height={14} aria-hidden />
        <span>featured mod</span>
      </div>
      <a
        className="promo-card"
        href={CASTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        aria-label="GenneCaster — a spectating mod for Gorilla Tag casters, visit caster.gennesis.cc"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- screenshot served from R2; next/image adds nothing in a static export */}
        <img
          className="promo-thumb"
          src={CASTER_IMAGE}
          alt="A Gorilla Tag player being cast in a public lobby"
          width={480}
          height={270}
          loading="lazy"
          decoding="async"
        />
        <span className="promo-body">
          <span className="promo-title">GenneCaster</span>
          <span className="promo-tagline">A spectating mod for casters who want full control.</span>
          <span className="promo-cta">visit &#8594;</span>
        </span>
      </a>
    </section>
  );
}
