import Control from "sap/ui/core/Control";
import ComponentContainer from "sap/ui/core/ComponentContainer";
import HTML from "sap/ui/core/HTML";
import MessageStrip from "sap/m/MessageStrip";
import { ApplicationConfig, OpenedApplication, PortalMessage } from "./models";
import { WorkspaceAdapter } from "./WorkspaceAdapter";
import AdapterTabContainer from "./AdapterTabContainer";

export default class Ui5TabWorkspaceAdapter implements WorkspaceAdapter {
  public readonly key = "UI5_TAB" as const;
  private opened = new Map<string, { info: OpenedApplication; control: Control }>();
  private activeId?: string;
  private readonly tabs = new AdapterTabContainer(id => this.activate(id));
  public open(app: ApplicationConfig): void { if (!this.opened.has(app.id)) { const control = this.createContent(app); const info = this.info(app); this.opened.set(app.id, { info, control }); this.tabs.open(info, control); } this.activate(app.id); }
  public close(id: string): void { this.tabs.close(id); this.opened.delete(id); if (this.activeId === id) this.activeId = this.opened.keys().next().value; if (this.activeId) this.tabs.activate(this.activeId); }
  public closeAll(): void { this.tabs.closeAll(); this.opened.clear(); this.activeId = undefined; }
  public activate(id: string): void { if (this.opened.has(id)) { this.activeId = id; this.tabs.activate(id); } }
  public sendMessage(message: PortalMessage): void { this.postToIframe(message); }
  public getOpenedApplications(): OpenedApplication[] { return [...this.opened.values()].map(item => item.info); }
  public getWorkspaceControl(): Control | undefined { return this.opened.size ? this.tabs.getControl() : undefined; }
  public getActiveControl(): Control | undefined { return this.activeId ? this.opened.get(this.activeId)?.control : undefined; }
  private info(app: ApplicationConfig): OpenedApplication { return { instanceId: app.id, applicationId: app.id, title: app.title, icon: app.icon }; }
  private postToIframe(message: PortalMessage): void { const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-application-id="${message.target}"]`); iframe?.contentWindow?.postMessage(message, window.location.origin); }
  private createContent(app: ApplicationConfig): Control {
    if (app.applicationType === "IFRAME") return new HTML({ content: `<iframe class="appFrame" data-application-id="${app.id}" sandbox="allow-scripts allow-forms allow-same-origin" title="${app.title}" src="${app.target}"></iframe>` });
    if (app.applicationType === "CUSTOM_HANDLER") return new MessageStrip({ text: "CUSTOM_HANDLER extension point", type: "Information", showIcon: true });
    return new ComponentContainer({ name: app.target, async: true, height: "100%" });
  }
}
