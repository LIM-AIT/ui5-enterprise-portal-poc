import Control from "sap/ui/core/Control";
import HTML from "sap/ui/core/HTML";
import MessageStrip from "sap/m/MessageStrip";
import { ApplicationConfig, OpenedApplication, PortalMessage } from "./models";
import { WorkspaceAdapter } from "./WorkspaceAdapter";
import IframeWorkspaceContainer from "./IframeWorkspaceContainer";

/** URL/iframe-first adapter for React, Vue, Nexacro and other Non-SAP web applications. */
export default class IframeWorkspaceAdapter implements WorkspaceAdapter {
  public readonly key = "IFRAME" as const;
  private opened = new Map<string, { info: OpenedApplication; control: Control }>();
  private activeId?: string;
  private readonly tabs: IframeWorkspaceContainer;
  public constructor(private readonly onWorkspaceChange?: () => void) {
    this.tabs = new IframeWorkspaceContainer(id => this.activate(id), id => this.close(id));
  }
  public open(app: ApplicationConfig): void { if (!this.opened.has(app.id)) { const info = { instanceId: app.id, applicationId: app.id, title: app.title, icon: app.icon }; const control = this.createContent(app); this.opened.set(app.id, { info, control }); this.tabs.open(info, control); } this.activate(app.id); }
  public close(id: string): void { this.tabs.close(id); this.opened.delete(id); if (this.activeId === id) this.activeId = this.opened.keys().next().value; if (this.activeId) this.tabs.activate(this.activeId); this.onWorkspaceChange?.(); }
  public closeAll(): void { this.tabs.closeAll(); this.opened.clear(); this.activeId = undefined; this.onWorkspaceChange?.(); }
  public activate(id: string): void { if (this.opened.has(id)) { this.activeId = id; this.tabs.activate(id); } }
  public sendMessage(message: PortalMessage): void { const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-application-id="${message.target}"]`); iframe?.contentWindow?.postMessage(message, window.location.origin); }
  public getOpenedApplications(): OpenedApplication[] { return [...this.opened.values()].map(item => item.info); }
  public getWorkspaceControl(): Control | undefined { return this.opened.size ? this.tabs.getControl() : undefined; }
  public getActiveControl(): Control | undefined { return this.activeId ? this.opened.get(this.activeId)?.control : undefined; }
  private createContent(app: ApplicationConfig): Control {
    if (app.applicationType !== "IFRAME") return new MessageStrip({ text: `${app.title} requires a URL-compatible application type in IframeWorkspaceAdapter.`, type: "Warning", showIcon: true });
    return new HTML({ content: `<iframe class="appFrame" data-application-id="${app.id}" sandbox="allow-scripts allow-forms allow-same-origin" title="${app.title}" src="${app.target}"></iframe>` });
  }
}
