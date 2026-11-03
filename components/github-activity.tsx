"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { GitHubIcon } from "./icons";
import { GITHUB_USER } from "@/lib/site";

interface GitHubCommit {
  message?: string;
  sha?: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    ref?: string;
    ref_type?: string;
    action?: string;
    commits?: GitHubCommit[];
    pull_request?: { title?: string; html_url?: string };
    issue?: { title?: string; html_url?: string };
  };
}

interface ActivityItem {
  key: string;
  verb: string;
  repo: string;
  detail?: string;
  href: string;
  time: string;
}

const PROFILE_URL = `https://github.com/${GITHUB_USER}`;
const MAX_ITEMS = 5;

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function shorten(text: string, max = 60): string {
  const line = text.split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function toItem(event: GitHubEvent): ActivityItem | null {
  const repo = event.repo.name.split("/")[1] ?? event.repo.name;
  const base = { key: event.id, repo, time: relativeTime(event.created_at) };
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload.commits ?? [];
      const last = commits[commits.length - 1];
      if (!last?.sha) return null;
      return {
        ...base,
        verb: "pushed",
        detail: last.message ? shorten(last.message) : undefined,
        href: `${repoUrl}/commit/${last.sha}`,
      };
    }
    case "CreateEvent":
      return {
        ...base,
        verb: "created",
        detail: [event.payload.ref_type, event.payload.ref].filter(Boolean).join(" "),
        href: repoUrl,
      };
    case "WatchEvent":
      return { ...base, verb: "starred", href: repoUrl };
    case "ForkEvent":
      return { ...base, verb: "forked", href: repoUrl };
    case "PullRequestEvent":
      return {
        ...base,
        verb: `${event.payload.action ?? "updated"} PR`,
        detail: event.payload.pull_request?.title ? shorten(event.payload.pull_request.title) : undefined,
        href: event.payload.pull_request?.html_url ?? repoUrl,
      };
    case "IssuesEvent":
      return {
        ...base,
        verb: `${event.payload.action ?? "updated"} issue`,
        detail: event.payload.issue?.title ? shorten(event.payload.issue.title) : undefined,
        href: event.payload.issue?.html_url ?? repoUrl,
      };
    default:
      return null;
  }
}

type Status = "loading" | "ready" | "empty" | "error";

export default function GitHubActivity({
  onNavigate,
}: {
  onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
        { signal, headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
      const events = (await response.json()) as GitHubEvent[];
      const next = events.map(toItem).filter((item): item is ActivityItem => item !== null).slice(0, MAX_ITEMS);
      setItems(next);
      setStatus(next.length ? "ready" : "empty");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state updates land after await, not synchronously
    load(controller.signal);

    const refresh = () => {
      if (document.visibilityState === "visible") load(controller.signal);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  return (
    <section className="gh-feed" aria-label="Recent GitHub activity">
      <div className="gh-head">
        <GitHubIcon className="btn-icon" width={14} height={14} aria-hidden />
        <span>recent activity</span>
      </div>
      {status === "loading" ? (
        <p className="gh-note">loading&#8230;</p>
      ) : status === "error" ? (
        <p className="gh-note">
          <a href={PROFILE_URL} onClick={onNavigate}>
            view on github &#8594;
          </a>
        </p>
      ) : status === "empty" ? (
        <p className="gh-note">no recent public activity</p>
      ) : (
        <ul className="gh-list">
          {items.map((item) => (
            <li key={item.key}>
              <a href={item.href} onClick={onNavigate}>
                <span className="gh-line">
                  <span className="gh-verb">{item.verb}</span>
                  <span className="gh-repo">{item.repo}</span>
                  <span className="gh-time">{item.time}</span>
                </span>
                {item.detail ? <span className="gh-detail">{item.detail}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
