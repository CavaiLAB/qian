// 制品里引用了却没有绑定的 React（0.2.1）。经典 JSX 转换把 <div /> 编成 React.createElement('div')，
// 模块里要是没有 import React，消费方一渲染就报 ReferenceError: React is not defined（0.2.0 的 data、biz 就是这样）。
// 类型检查与打包都不会报这个错，所以由 pack.mjs 逐个模块查。
//
// 名字的解析交给 TypeScript：不加载标准库与类型声明、不解析被导入的模块，只看模块自己的 import 与声明，
// 解析不到绑定的 React 就是自由变量。字符串、注释、属性名（obj.React、{ React: 1 }）不算；嵌套作用域里自己声明的 React 算绑定。
import ts from 'typescript';

const OPTIONS = { allowJs: true, checkJs: false, noLib: true, noResolve: true, noEmit: true, types: [], target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };

/** 只是属性名或标签、不引用变量的位置。 */
function nameOnly(node) {
  const { parent } = node;
  if (ts.isPropertyAccessExpression(parent)) return parent.name === node;
  if (ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent) || ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent)) return parent.name === node;
  if (ts.isBindingElement(parent)) return parent.propertyName === node;
  // import { React as R } from 'x'、export { React } from 'x'：说的是另一个模块的导出名；export { X as React } 里 React 只是导出名。
  if (ts.isImportSpecifier(parent)) return parent.propertyName === node;
  if (ts.isExportSpecifier(parent)) return Boolean(parent.parent.parent.moduleSpecifier) || (Boolean(parent.propertyName) && parent.name === node);
  return ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent) || ts.isMetaProperty(parent);
}

/**
 * 找出模块里对自由变量 React 的引用。
 * @param {{ file: string, text: string }[]} modules 同一个包里的 JS 模块
 * @returns {{ file: string, line: number, column: number }[]} 每一处的位置（行、列从 1 起）
 */
export function freeReactReferences(modules) {
  const sources = new Map(modules.map(({ file, text }) => [`/${file}`, ts.createSourceFile(`/${file}`, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)]));
  const host = {
    getSourceFile: (name) => sources.get(name),
    fileExists: (name) => sources.has(name),
    readFile: () => undefined,
    writeFile: () => {},
    getDefaultLibFileName: () => '/lib.d.ts',
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };
  const checker = ts.createProgram({ rootNames: [...sources.keys()], options: OPTIONS, host }).getTypeChecker();
  const found = [];
  for (const [name, source] of sources) {
    const visit = (node) => {
      if (ts.isIdentifier(node) && node.text === 'React' && !nameOnly(node)) {
        const { parent } = node;
        const symbol = ts.isShorthandPropertyAssignment(parent) ? checker.getShorthandAssignmentValueSymbol(parent)
          : ts.isExportSpecifier(parent) ? checker.getExportSpecifierLocalTargetSymbol(parent)
          : checker.getSymbolAtLocation(node);
        if (!symbol) {
          const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
          found.push({ file: name.slice(1), line: line + 1, column: character + 1 });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}
