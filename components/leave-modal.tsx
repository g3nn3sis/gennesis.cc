"use client";

import { useEffect, useRef } from "react";

interface LeaveModalProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function LeaveModal({ open, onStay, onLeave }: LeaveModalProps) {
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    stayButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onStay, onLeave]);

  return (
    <div
      className={`modal-overlay${open ? " visible" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onStay();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title">
        <p id="leave-modal-title">Are you sure?</p>
        <div className="modal-buttons">
          <button ref={stayButtonRef} type="button" className="modal-btn" onClick={onStay}>
            Stay
          </button>
          <button type="button" className="modal-btn" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
