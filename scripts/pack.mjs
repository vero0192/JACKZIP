import {readdir,readFile,writeFile,mkdir,mkdtemp,rename,rmdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=resolve(root,'../output/repository');await mkdir(output,{recursive:true});
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){
 if(['node_modules','dist','test-results','playwright-report','.git','.DS_Store','.env'].includes(entry.name)||entry.name.startsWith('.env.')||entry.name.endsWith('.log'))continue;
 const path=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Do not package symbolic links: '+path);
 if(entry.isDirectory())result.push(...await files(path));else result.push(relative(root,path));
}return result.sort()}
let names=await files(root);
const revisionHash=createHash('sha256');
for(const file of names.filter(f=>f.endsWith('.js')||f.endsWith('.css')||f==='index.html'||f==='manifest.webmanifest'||f.startsWith('assets/'))){
 let bytes=await readFile(join(root,file));
 if(file==='sw.js')bytes=Buffer.from(bytes.toString().replace(/const CACHE=PREFIX\+"[^"]+";/,'const CACHE=PREFIX+"BUILD";'));
 revisionHash.update(file).update(bytes);
}
const revision=revisionHash.digest('hex').slice(0,12);
const sw=await readFile(join(root,'sw.js'),'utf8');
await writeFile(join(root,'sw.js'),sw.replace(/const CACHE=PREFIX\+"[^"]+";/,`const CACHE=PREFIX+"5.1.0-${revision}";`));
const info=JSON.parse(await readFile(join(root,'BUILD_INFO.json'),'utf8'));info.revision=revision;await writeFile(join(root,'BUILD_INFO.json'),JSON.stringify(info,null,2)+'\n');
names=[...new Set([...names,'FILE_MANIFEST.txt','inventory.json','SHA256SUMS.txt'])].sort();
await writeFile(join(root,'FILE_MANIFEST.txt'),names.join('\n')+'\n');
const digest=async file=>createHash('sha256').update(await readFile(join(root,file))).digest('hex');
const inventory=[];for(const file of names.filter(f=>!['inventory.json','SHA256SUMS.txt'].includes(f)))inventory.push({file,sha256:await digest(file)});
await writeFile(join(root,'inventory.json'),JSON.stringify({product:'JACKZIP',version:'5.1.0',revision,files:inventory},null,2)+'\n');
const sums=[];for(const file of names.filter(f=>f!=='SHA256SUMS.txt'))sums.push(`${await digest(file)}  ${file}`);
await writeFile(join(root,'SHA256SUMS.txt'),sums.join('\n')+'\n');
const stage=await mkdtemp(join(output,'.stage-')),temporary=join(stage,'repository.zip');
const zip=spawnSync('zip',['-q',temporary,...names],{cwd:root,encoding:'utf8'});if(zip.status!==0)throw Error(zip.stderr||'ZIP creation failed');
const archive=join(output,'JACKZIP_v5.1.0_Repository_Candidate.zip');await rename(temporary,archive);await rmdir(stage);
console.log(JSON.stringify({archive,revision,files:names.length,sha256:await digest(relative(root,archive))},null,2));
