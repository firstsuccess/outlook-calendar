import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve('dist'),assets={};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.png':'image/png','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
async function visit(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(entry.name.startsWith('.')||entry.name==='server'||entry.name==='_headers')continue;const file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(entry.isFile())assets['/'+path.relative(root,file).split(path.sep).join('/')]={body:(await fs.readFile(file)).toString('base64'),type:types[path.extname(file)]||'application/octet-stream'};}}
await visit(root);if(!assets['/index.html']||!assets['/addin.html']||!assets['/config.json'])throw Error('Run the static build first');
const source=(await fs.readFile('worker/index.ts','utf8')).replace('/*__SITE_ASSETS__*/ {}',JSON.stringify(assets));
const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js',result.outputText);await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log(`Sites worker built with ${Object.keys(assets).length} embedded assets`);
