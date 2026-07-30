import Control from "sap/ui/core/Control";
import ComponentContainer from "sap/ui/core/ComponentContainer";
import HTML from "sap/ui/core/HTML";
import MessageStrip from "sap/m/MessageStrip";
import VBox from "sap/m/VBox";
import { ApplicationConfig, OpenedApplication, PortalMessage } from "./models";
import { WorkspaceAdapter } from "./WorkspaceAdapter";
import AdapterTabContainer from "./AdapterTabContainer";

/** Customer MDI simulation: its container and tabs are owned entirely by this adapter. */
export default class CustomWorkspaceAdapter implements WorkspaceAdapter {
  public readonly key = "CUSTOM" as const;
  private opened = new Map<string, { info: OpenedApplication; control: Control }>();
  private activeId?: string;
  private readonly tabs = new AdapterTabContainer(id => this.activate(id));
  private readonly container = new VBox({ fitContainer: true, items: [
    new MessageStrip({ text: "Customer MDI simulation · this adapter owns the tab strip and content area.", type: "Information", showIcon: true }),
    this.tabs.getControl()
  ] }).addStyleClass("customWorkspaceAdapter");
  public open(app: ApplicationConfig): void {
    if (!this.opened.has(app.id)) { const info = { instanceId: app.id, applicationId: app.id, title: app.title, icon: app.icon }; const control = this.createContent(app); this.opened.set(app.id, { info, control }); this.tabs.open(info, control); }
    this.activate(app.id);
  }
  public close(id: string): void { this.tabs.close(id); this.opened.delete(id); if (this.activeId === id) this.activeId = this.opened.keys().next().value; if (this.activeId) this.tabs.activate(this.activeId); }
  public closeAll(): void { this.tabs.closeAll(); this.opened.clear(); this.activeId = undefined; }
  public activate(id: string): void { if (this.opened.has(id)) { this.activeId = id; this.tabs.activate(id); } }
  public sendMessage(message: PortalMessage): void { const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-application-id="${message.target}"]`); iframe?.contentWindow?.postMessage(message, window.location.origin); }
  public getOpenedApplications(): OpenedApplication[] { return [...this.opened.values()].map(item => item.info); }
  public getWorkspaceControl(): Control | undefined { return this.opened.size ? this.container : undefined; }
  public getActiveControl(): Control | undefined { return this.activeId ? this.opened.get(this.activeId)?.control : undefined; }
  private createContent(app: ApplicationConfig): Control { return app.applicationType === "IFRAME" ? new HTML({ content: `<iframe class="appFrame" data-application-id="${app.id}" sandbox="allow-scripts allow-forms allow-same-origin" title="${app.title}" src="${app.target}"></iframe>` }) : new ComponentContainer({ name: app.target, async: true, height: "100%" }); }
}
