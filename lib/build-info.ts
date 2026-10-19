export interface BuildInfo {
  sha: string;
  shortSha: string;
  branch: string;
}

export function getBuildInfo(): BuildInfo {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || "";
  return {
    sha: sha || "local",
    shortSha: sha ? sha.slice(0, 7) : "dev",
    branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.CF_PAGES_BRANCH || "local",
  };
}
