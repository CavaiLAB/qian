import { describe, expect, it } from 'vitest';
import { freeReactReferences } from '../../../scripts/release/free-react.mjs';

// 打包核对里「引用了却没有绑定的 React」这一条（scripts/release/pack.mjs，0.2.1）的自测：
// 经典 JSX 转换的产物要逐处报出来；导入或声明了 React 的、字符串、注释、属性名不报。
const check = (text: string) => freeReactReferences([{ file: 'dist/index.js', text }]).map(({ line, column }) => `${line}:${column}`);

describe('没有绑定的 React', () => {
  it('经典 JSX 转换、模块里只导入了具名钩子：每一处都报', () => {
    expect(check("import { useState } from 'react';\nexport const A = () => React.createElement(React.Fragment, null, useState(0)[0]);")).toEqual(['2:24', '2:44']);
  });

  it('导入或声明了 React 的不报', () => {
    expect(check("import React from 'react';\nexport const A = () => React.createElement('i');")).toEqual([]);
    expect(check("import * as React from 'react';\nexport const A = () => React.createElement(React.Fragment);")).toEqual([]);
    expect(check("import { default as React } from 'react';\nexport const A = () => React.createElement('i');")).toEqual([]);
    expect(check("const React = globalThis.React;\nexport const A = () => React.createElement('i');")).toEqual([]);
  });

  it('automatic JSX runtime 的产物不报', () => {
    expect(check("import { jsx, jsxs } from 'react/jsx-runtime';\nexport const A = () => jsxs('ul', { children: [jsx('li', {})] });")).toEqual([]);
  });

  it('字符串、注释、属性名、标签不算引用', () => {
    expect(check("const s = 'React.createElement'; // React.createElement\n/* React */ const o = { React: 1, React2: `React` }; o.React;\nReact: for (;;) break React;\nclass C { React() {} }\nconst { React: renamed } = o;\nexport { s, renamed, C };")).toEqual([]);
    expect(check("export { React } from 'react';\nexport { React as R2 } from 'react';")).toEqual([]);
  });

  it('简写属性、typeof 与导出本地名字也算引用', () => {
    expect(check('export const o = { React };')).toEqual(['1:20']);
    expect(check("export const has = typeof React !== 'undefined';")).toEqual(['1:27']);
    expect(check('export { React };')).toEqual(['1:10']);
    expect(check('const X = 1;\nexport { X as React };')).toEqual([]);
  });

  it('嵌套作用域里自己声明的 React 只管那个作用域', () => {
    expect(check("export function f(React) { return React.createElement('i'); }")).toEqual([]);
    expect(check("export function f(React) { return React.createElement('i'); }\nexport const g = () => React.Fragment;")).toEqual(['2:24']);
  });

  it('同一个包的多个模块各自判断：一个模块导入了 React，不能给另一个模块作数', () => {
    const found = freeReactReferences([
      { file: 'dist/a.js', text: "import React from 'react';\nexport const A = () => React.createElement('i');" },
      { file: 'dist/b.js', text: "export const B = () => React.createElement('b');" },
    ]);
    expect(found).toEqual([{ file: 'dist/b.js', line: 1, column: 24 }]);
  });
});
