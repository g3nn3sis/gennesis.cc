"use client";

import { useCallback, useState, type MouseEvent } from "react";
import type { BuildInfo } from "@/lib/build-info";
import { REPO_URL, SITE_NAME, TITLE_IMAGE, TRACKS } from "@/lib/site";
import { useBackgroundAudio } from "@/lib/use-background-audio";
import AudioControl from "./audio-control";
import LeaveModal from "./leave-modal";
import SocialLinks from "./social-links";

export default function Site({ build }: { build: BuildInfo }) {
  const [entered, setEntered] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const { audioRef, muted, play, toggleMuted, setVolume } = useBackgroundAudio(TRACKS);

  const enter = () => {
    setEntered(true);
    play();
  };

  const confirmLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setPendingUrl(e.currentTarget.href);
  };

  const stay = useCallback(() => setPendingUrl(null), []);

  const leave = useCallback(() => {
    if (pendingUrl) window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setPendingUrl(null);
  }, [pendingUrl]);

  const modalOpen = pendingUrl !== null;

  return (
    <>
      <div className="scanlines" />
      <div className="vignette" />

      <audio ref={audioRef} preload="auto" loop />
      <AudioControl muted={muted} onToggle={toggleMuted} onVolumeChange={setVolume} />

      <div
        className={`entry-screen${entered ? " hidden" : ""}`}
        onClick={enter}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            enter();
          }
        }}
      >
        <div className="entry-text">click to enter</div>
      </div>

      <main className={`main-content${entered ? " visible" : ""}${modalOpen ? " blurred" : ""}`}>
        <div className="title-container">
          <a className="title-link" href="https://gennesis.cc" aria-label="Go to gennesis.cc">
            {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF from R2; next/image adds nothing in a static export */}
            <img src={TITLE_IMAGE} alt={SITE_NAME} />
          </a>
        </div>

        <div className="content">
          <p>
            Hi!
            <br />
            Find me here:
          </p>
          <SocialLinks onNavigate={confirmLeave} />
          <div className="copyright corner corner-right">&copy; {SITE_NAME} 2026</div>
          <div className="corner corner-left">
            <a href={`${REPO_URL}/commit/${build.sha}`} target="_blank" rel="noopener" onClick={confirmLeave}>
              {`${build.branch} · ${build.shortSha}`}
            </a>
          </div>
        </div>
      </main>

      <LeaveModal open={modalOpen} onStay={stay} onLeave={leave} />
    </>
  );
}
