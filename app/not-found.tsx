import type { Metadata } from "next";
import Link from "next/link";
import RetroFire from "@/components/retro-fire";
import { SITE_NAME, TITLE_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: `404 | ${SITE_NAME}`,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <RetroFire />
      <div className="scanlines" />
      <div className="vignette" />

      <main className="main-content visible not-found">
        <section className="content">
          <h1>
            {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF from R2 */}
            <img className="not-found-title-image" src={TITLE_IMAGE} alt="404: page not found" />
          </h1>
          <Link className="not-found-link" href="/">
            return to home
          </Link>
        </section>
      </main>
    </>
  );
}
