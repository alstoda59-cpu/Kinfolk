import { cp, mkdir, readdir, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const nativeRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.resolve(nativeRoot,'..');
const destination=path.join(nativeRoot,'www');
await rm(destination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
for(const name of await readdir(source)) {
  if(/^(index\.html|offline\.html|manifest\.webmanifest|service-worker\.js|favicon\.ico|apple-touch-icon\.png|kinfolk-icon(?:-\d+)?\.(?:svg|png)|kinfolk-phase[\w-]+\.js)$/.test(name))
    await cp(path.join(source,name),path.join(destination,name));
}
const html=await readFile(path.join(destination,'index.html'),'utf8');
const localScripts=[...html.matchAll(/<script\s+src="(\/kinfolk-[^"]+\.js)"/g)].map(match=>match[1]);
for(const script of localScripts){
  const target=path.join(destination,script.slice(1));
  await readFile(target); // fails loudly if packaging drops an app module
}
console.log(`Prepared local Kinfolk web bundle in native/www (${localScripts.length} referenced modules checked)`);
