// Stage preflight: build the prospective accent, then ask the independent checker.
import {readFileSync} from 'node:fs';
import {accentOf} from './geometry.mjs';
import {auditIcon} from '../audit.mjs';
import {validateManifest} from '../checks/schema.mjs';
const prospective=validateManifest(JSON.parse(readFileSync(0,'utf8'))),icon=prospective.icons.at(-1);
const result=auditIcon(icon,{nodes:icon.nodes,accent:accentOf(icon)});
if(result.failures.length)throw Error(JSON.stringify(result.failures));
