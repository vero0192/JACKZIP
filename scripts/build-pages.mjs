import {cp,mkdir,readdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=join(root,'dist');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const files=(await readdir(root,{withFileTypes:true}))
  .filter(entry=>entry.isFile()&&(/\.(?:html|js|css|svg|png|webmanifest)$/.test(entry.name)||['.nojekyll','BUILD_INFO.json'].includes(entry.name)))
  .map(entry=>entry.name).sort();
for(const name of [...files,'assets'])await cp(join(root,name),join(output,name),{recursive:true});
console.log(`GitHub Pages artifact: ${output} (${files.length} root files plus assets/)`);
