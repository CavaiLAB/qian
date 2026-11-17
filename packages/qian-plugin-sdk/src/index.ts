export { PlatformClient, PlatformError, HttpResponseError, createMockTransport, createRegistries, Registry } from '@cavailab/qian-sdk';
export type { PlatformClientOptions, RequestMiddleware, RequestTransport, JsonSchema, JsonValue } from '@cavailab/qian-sdk';
export { ShellHost } from './host';
export { SLOT_IDS, SDK_VERSION } from './contracts';
export type { ClientActionDescriptor, DeepReadonly, FederationTransport, RemoteBridge, RemoteModule, RemoteRegistration, RemoteViewProps, ShellAuditEvent, ShellContext, ShellHostOptions, ShellScope, SlotContribution, SlotDescriptor, SlotId, SlotOutputs, UiManifest } from './contracts';
export type { BridgeCaller, PublicBridge } from './bridge';
export { slotContracts, validateManifest, validateSlot } from './validation';
export { ShellError } from './errors';
