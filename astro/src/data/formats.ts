import list from './formats.json';

/** The formats my tools and agents write, as the experience vault's index lists them. The vault owns the index
 *  and works out each skeleton; `npm run formats:sync` writes formats.json and nothing here edits it. */
export interface FormatField {
  name: string;
  type: string;
  required: string;
  values: string[];
  notes: string;
}

export interface FormatRecord {
  name: string;
  /** The lines its terminal window shows: a comment naming the format, then one `field: values` per field. */
  skeleton: string[];
  fields: FormatField[];
}

export interface FormatFamily {
  id: string;
  area: string;
  what: string;
  version: string;
  issuer: string;
  status: string;
  defined_in: string;
  copied_from: string;
  records: FormatRecord[];
}

export interface PageType extends FormatRecord {
  id: string;
  version: string;
  what: string;
  home: string;
}

export interface FormatArea {
  id: string;
  title: string;
  what: string;
}

export const FORMATS_HREF = '/formats/';
export const FORMATS_SUMMARY: string = list.summary;
export const FORMAT_AREAS: readonly FormatArea[] = list.areas;
export const FORMAT_FAMILIES: readonly FormatFamily[] = list.families;
export const PAGE_TYPES: readonly PageType[] = list.page_types.map((t) => ({ ...t, name: '' }));

/** What a family's status means, as its card says it. */
export const FORMAT_STATUS: Record<string, string> = {
  built: 'in use',
  planned: 'planned',
  outside: 'copied in',
};

// The page groups families by area, so a family in an area it does not list would vanish without a word.
const areas = FORMAT_AREAS.map((area) => area.id);
const stray = FORMAT_FAMILIES.find((family) => !areas.includes(family.area));
if (stray) throw new Error(`formats.json: "${stray.id}" is in an area the page does not list`);
