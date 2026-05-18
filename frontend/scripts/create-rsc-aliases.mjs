import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const outDir = join(process.cwd(), 'out');

function walk(dir, visitor) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      visitor(path, true);
      walk(path, visitor);
    } else {
      visitor(path, false);
    }
  }
}

if (existsSync(outDir)) {
  walk(outDir, (path, isDirectory) => {
    if (isDirectory || !path.includes(`${sep}__next.!`)) {
      return;
    }

    const parts = path.split(sep);
    const markerIndex = parts.findIndex((part) => part.startsWith('__next.!'));
    if (markerIndex < 1 || markerIndex === parts.length - 1) {
      return;
    }

    const marker = parts[markerIndex];
    const parentDir = parts.slice(0, markerIndex).join(sep);
    const source = path;
    const nested = parts.slice(markerIndex + 1).join('.');
    const alias = join(parentDir, `${marker}.${nested}`);
    mkdirSync(parentDir, { recursive: true });
    if (!existsSync(alias)) {
      copyFileSync(source, alias);
    }
  });

  console.log(`RSC alias statici aggiornati in ${relative(process.cwd(), outDir)}`);
}
