"use client";

import { useEffect } from "react";

interface LeaveModalProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function LeaveModal({ open, onStay, onLeave }: LeaveModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
      if (e.key === "Enter") {
        e.preventDefault();
        onLeave();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onStay, onLeave]);

  return (
    <div
      className={`modal-overlay${open ? " visible" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onStay();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Leave gennesis.cc?">
        <p>Are you sure?</p>
        <div className="modal-buttons">
          <button type="button" className="modal-btn" onClick={onStay}>
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
