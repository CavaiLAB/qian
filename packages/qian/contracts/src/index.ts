// Schema 先导入再以常量导出：这样生成的声明文件里写的是每份 Schema 的类型本身，不再引用 *.schema.json。
// 这些 JSON 文件不随包发布（值已打进 dist/index.js），声明文件引用它们时，使用方不跳过库的类型检查就会报 TS2307。
import componentManifestSchemaJson from './component-manifest.schema.json';
import dataColumnSchemaJson from './data-column.schema.json';
import errorDetailSchemaJson from './error-detail.schema.json';
import formSchemaJson from './form.schema.json';
import listSchemaJson from './list.schema.json';
import sseEventSchemaJson from './sse-event.schema.json';
import widgetSchemaJson from './widget.schema.json';

export const PACKAGE_NAME = '@cavailab/qian-contracts' as const;
export type { ComponentManifest } from './component-manifest.generated';
export const componentManifestSchema = componentManifestSchemaJson;
export type { ErrorDetail } from './error-detail.generated';
export type { SseEvent } from './sse-event.generated';
export const errorDetailSchema = errorDetailSchemaJson;
export const sseEventSchema = sseEventSchemaJson;
export type { FormSchema, UiNode } from './form.generated';
export type { ListSchema } from './list.generated';
export type { WidgetMeta } from './widget.generated';
export const formSchema = formSchemaJson;
export const listSchema = listSchemaJson;
export const widgetSchema = widgetSchemaJson;
export type { DataColumnMeta } from './data-column.generated';
export const dataColumnSchema = dataColumnSchemaJson;
