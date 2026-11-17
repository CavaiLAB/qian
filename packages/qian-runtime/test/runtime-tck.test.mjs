import path from 'node:path';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';
import {parse} from 'yaml';
import * as runtime from '../dist/index.js';
// 与 .NET 运行时共用的一致性用例（TCK）留在后端仓库：场景、profile 装配器（命令行构建出的 profiles.js）与 tck/profiles/base 都取自后端的检出，
// 本仓库只提供被测的运行时。默认的 test 跳过这里；pnpm test:tck 之前把 QIAN_TCK_BACKEND_DIR 指向后端检出里构建过命令行的那一层目录，也就是清单的路径前缀（S1-YUE-023，见 README）。
const backend=process.env.QIAN_TCK_BACKEND_DIR;
if(!backend){
 if(process.env.npm_lifecycle_event==='test:tck')throw new Error('test:tck 需要环境变量 QIAN_TCK_BACKEND_DIR 指向后端检出里清单路径前缀那一层目录（先在那里构建命令行，见 README）');
 test('运行时一致性用例（TCK）',{skip:'没有设 QIAN_TCK_BACKEND_DIR：用例在后端仓库，用 pnpm test:tck 跑'},()=>{});
}else{
 const root=path.resolve(backend);
 const load=file=>import(pathToFileURL(path.join(root,file)).href);
 const {loadProfile}=await load('packages/qian-cli/dist/profiles.js');
 const {runtimeScenarios}=await load('tck/runtime/harness-ts.mjs');
 const {assemblyScenarios}=await load('tck/runtime/assembly-ts.mjs');
 runtimeScenarios(runtime,parse,loadProfile,root);
 assemblyScenarios(runtime.PluginLoader,loadProfile,root);
}
