import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `404 | ${SITE_NAME}`,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <div className="scanlines" />
      <div className="vignette" />

      <main className="main-content visible not-found" aria-labelledby="not-found-title">
        <section className="content">
          <p className="not-found-code" aria-hidden="true">
            404
          </p>
          <h1 id="not-found-title">lost in the void</h1>
          <p>this page does not exist.</p>
          <Link className="not-found-link" href="/">
            return home
          </Link>
        </section>
      </main>
    </>
  );
}
