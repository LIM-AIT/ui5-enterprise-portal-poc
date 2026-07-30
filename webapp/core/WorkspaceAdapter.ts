import Control from "sap/ui/core/Control";
import { ApplicationConfig, OpenedApplication, PortalMessage } from "./models";

export type WorkspaceAdapterKey = "UI5_TAB" | "IFRAME" | "CUSTOM";

/** Customer-replaceable boundary between Portal Core and a workspace/MDI container. */
export interface WorkspaceAdapter {
  readonly key: WorkspaceAdapterKey;
  open(application: ApplicationConfig): void;
  close(instanceId: string): void;
  closeAll(): void;
  activate(instanceId: string): void;
  sendMessage(message: PortalMessage): void;
  getOpenedApplications(): OpenedApplication[];
  /** Adapter-owned content surface hosted by the Portal Shell. */
  getWorkspaceControl(): Control | undefined;
  getActiveControl(): Control | undefined;
}
