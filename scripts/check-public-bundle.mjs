import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicAppDir = join(repoRoot, 'apps/public-web');
const forbiddenPatterns = [
  /from\s+['"][^'"]*(?:@margo\/admin-web|apps\/admin-web|theme-preset-switcher|builder-preview-device-switcher|global-admin\/theme-studio|tenant\/builder)['"]/,
  /import\s+['"][^'"]*(?:@margo\/admin-web|apps\/admin-web|theme-preset-switcher|builder-preview-device-switcher|global-admin\/theme-studio|tenant\/builder)['"]/,
];

const violations = [];
for (const file of walk(publicAppDir)) {
  if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      violations.push(file.replace(`${repoRoot}/`, ''));
      break;
    }
  }
}

if (violations.length) {
  console.error('Public bundle budget violated by forbidden admin/theme imports:');
  for (const file of violations) console.error(`- ${file}`);
  process.exitCode = 1;
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (statSync(full).isFile()) files.push(full);
  }
  return files;
}
