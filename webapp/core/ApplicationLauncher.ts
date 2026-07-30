import { ApplicationConfig } from "./models";
import PortalMessageBroker from "./PortalMessageBroker";
import { WorkspaceAdapter } from "./WorkspaceAdapter";
import HttpDestinationResolver, { DestinationResolver } from "./DestinationResolver";

export type CustomApplicationHandler = (application: ApplicationConfig) => void;
export default class ApplicationLauncher {
  private readonly customHandlers = new Map<string, CustomApplicationHandler>();
  public constructor(private workspace: WorkspaceAdapter, private readonly broker: PortalMessageBroker, private readonly destinations: DestinationResolver = new HttpDestinationResolver()) {}
  public setWorkspaceAdapter(workspace: WorkspaceAdapter): void { this.workspace = workspace; }
  public registerCustomHandler(target: string, handler: CustomApplicationHandler): void { this.customHandlers.set(target, handler); }
  public async launch(application: ApplicationConfig): Promise<void> {
    if (!application.active) throw new Error(`Inactive application: ${application.id}`);
    const resolved = await this.destinations.resolve(application);
    if (resolved.applicationType === "EXTERNAL_WINDOW") window.open(resolved.target, "_blank", "noopener");
    else if (resolved.applicationType === "CUSTOM_HANDLER") { const handler = this.customHandlers.get(resolved.target); if (!handler) throw new Error(`No custom handler registered for: ${resolved.target}`); handler(resolved); }
    else this.workspace.open(resolved);
    this.broker.publish(this.broker.create("portal", resolved.id, "APPLICATION_OPENED", { applicationId: resolved.id }));
  }
}
