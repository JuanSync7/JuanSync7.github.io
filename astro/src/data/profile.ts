/**
 * The CV-backed part of the site: the role line, title, CV file and Experience section.
 * profile.json is generated in the private career repo and pushed here by its publish workflow,
 * so it changes whenever the CV does. Never edit it by hand: the next publish overwrites it.
 * The shape is checked at build time, so a malformed file fails the deploy instead of the page.
 */
import raw from './profile.json';

export interface ProfilePoint {
  tag: string;
  text: string;
}

export interface ProfileRole {
  title: string;
  org: string;
  dates: string;
  place?: string;
  summary: string;
  points?: readonly ProfilePoint[];
}

export interface Profile {
  source: string;
  title: string;
  role_line: string;
  cv_file: string;
  experience: readonly ProfileRole[];
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isString = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

function isPoint(x: unknown): x is ProfilePoint {
  return isRecord(x) && isString(x.tag) && isString(x.text);
}

function isRole(x: unknown): x is ProfileRole {
  if (!isRecord(x)) return false;
  if (!isString(x.title) || !isString(x.org) || !isString(x.dates) || typeof x.summary !== 'string') return false;
  if (x.place !== undefined && !isString(x.place)) return false;
  return x.points === undefined || (Array.isArray(x.points) && x.points.every(isPoint));
}

function parseProfile(x: unknown): Profile {
  if (
    isRecord(x) && isString(x.source) && isString(x.title) && isString(x.role_line) && isString(x.cv_file) &&
    x.cv_file.startsWith('/') && Array.isArray(x.experience) && x.experience.length > 0 && x.experience.every(isRole)
  ) {
    return { source: x.source, title: x.title, role_line: x.role_line, cv_file: x.cv_file, experience: x.experience };
  }
  throw new Error('astro/src/data/profile.json does not match the Profile shape; rebuild it in the career repo');
}

export const PROFILE: Profile = parseProfile(raw as unknown);
