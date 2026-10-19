import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import JavaScriptObfuscator from "javascript-obfuscator";

const clientAssetsDirectory =
  process.env.OBFUSCATION_ASSETS_DIR ??
  join(process.cwd(), "out", "_next", "static");

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  target: "browser-no-eval",
  transformObjectKeys: true,
};

async function findJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return findJavaScriptFiles(path);
      return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
    }),
  );

  return files.flat();
}

const files = await findJavaScriptFiles(clientAssetsDirectory);

await Promise.all(
  files.map(async (file) => {
    const source = await readFile(file, "utf8");
    const obfuscated = JavaScriptObfuscator.obfuscate(source, obfuscationOptions);
    await writeFile(file, obfuscated.getObfuscatedCode());
  }),
);

console.log(`Obfuscated ${files.length} browser JavaScript bundles.`);
