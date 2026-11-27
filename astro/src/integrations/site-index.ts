import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { collect, type BuiltFile, type RouteInfo } from '../lib/site-index/collect';
import { treeText } from '../lib/site-index/text';
import { buildTree } from '../lib/site-index/tree';

/** Where the index is served; the search and the /site-index/ page read it from here. */
export const INDEX_JSON = 'site-index.json';
export const INDEX_TEXT = 'site-index.txt';

/** Folders the build fills with bundles and fonts, never pages. */
const SKIP = new Set(['_astro', 'fonts']);

function walk(dir: string, root: string): BuiltFile[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return SKIP.has(name) && dir === root ? [] : walk(full, root);
    const file = `/${relative(root, full).split(sep).join('/')}`;
    return name.endsWith('.html') ? [{ file, html: readFileSync(full, 'utf8') }] : [{ file }];
  });
}

/**
 * Writes the site index after every build: every page and file the build made, each with the route file
 * that made it, read from dist so nothing has to be listed by hand. A built page no route claims, a page
 * with no title or a route that made nothing fails the build. In dev the last build's index is served.
 */
export default function siteIndex(): AstroIntegration {
  let dist = '';
  return {
    name: 'site-index',
    hooks: {
      'astro:config:done': ({ config }) => {
        dist = fileURLToPath(config.outDir);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const name = req.url?.split('?')[0]?.slice(1);
          if (name !== INDEX_JSON && name !== INDEX_TEXT) return next();
          const file = join(dist, name);
          res.setHeader('Content-Type', name === INDEX_JSON ? 'application/json' : 'text/plain; charset=utf-8');
          if (existsSync(file)) return res.end(readFileSync(file));
          res.statusCode = 404;
          res.end(name === INDEX_JSON ? '{"error":"the index is written by the build: run npm run build"}' : '');
        });
      },
      'astro:build:done': ({ dir, routes, logger }) => {
        const root = fileURLToPath(dir);
        const infos: RouteInfo[] = routes.flatMap((r) =>
          r.type === 'page' || r.type === 'endpoint'
            ? [{ file: r.component, kind: r.type === 'page' ? 'page' : 'file', pattern: r.pattern, dynamic: r.params.length > 0 }]
            : [],
        );
        const { index, problems } = collect(walk(root, root), infos);
        if (problems.length) {
          for (const p of problems) logger.error(p);
          throw new Error(`site index: ${problems.length} problem(s), listed above`);
        }
        writeFileSync(join(root, INDEX_JSON), JSON.stringify(index));
        writeFileSync(join(root, INDEX_TEXT), treeText(buildTree(index.entries)));
        const pages = index.entries.filter((e) => e.kind === 'page').length;
        logger.info(`${INDEX_JSON}: ${pages} pages, ${index.entries.length - pages} files, from ${index.routes.length} route files`);
      },
    },
  };
}
