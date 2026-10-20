export const SITE_URL = "https://gennesis.cc/";
export const SITE_NAME = "gennesis.cc";
export const ASSET_ORIGIN = "https://r2.gennesis.cc";
export const REPO_URL = "https://github.com/g3nn3sis/gennesis.cc";
export const TITLE_IMAGE = `${ASSET_ORIGIN}/9f51a7472a58e26f.gif`;

export const TRACKS = [
  `${ASSET_ORIGIN}/89395cee6fa00b64.mp3`,
  `${ASSET_ORIGIN}/e04a764c77b8cb7c.mp3`,
  `${ASSET_ORIGIN}/6384738f8f24bc9e.mp3`,
] as const;

// Generate with `node scripts/encode-email.mjs <address>`; decoded client-side by lib/email.ts.
export const CONTACT_EMAIL = "ee84b31ff551c7a80ce03360df2593eb4fd33a91f91cac0364";
