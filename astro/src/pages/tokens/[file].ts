import type { APIRoute, GetStaticPaths } from 'astro';
import { DTCG_FILES } from '../../lib/site-tokens';

type Name = keyof typeof DTCG_FILES;
const isName = (v: string | undefined): v is Name => v !== undefined && v in DTCG_FILES;

/** The site's tokens as W3C Design Tokens (DTCG 2025.10): a foundation file, a light and a dark
 *  theme file, and the resolver that joins them. */
export const getStaticPaths: GetStaticPaths = () => Object.keys(DTCG_FILES).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) => {
  const file = params.file;
  if (!isName(file)) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(DTCG_FILES[file], null, 2), {
    headers: { 'Content-Type': 'application/design-tokens+json; charset=utf-8' },
  });
};
