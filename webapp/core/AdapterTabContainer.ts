import Control from "sap/ui/core/Control";
import IconTabBar from "sap/m/IconTabBar";
import IconTabFilter from "sap/m/IconTabFilter";
import { OpenedApplication } from "./models";

/** UI5 reference tab container owned by an adapter, never by Portal Shell. */
export default class AdapterTabContainer {
  private readonly tabs: IconTabBar;
  private readonly filters = new Map<string, IconTabFilter>();
  public constructor(onActivate: (id: string) => void) {
    this.tabs = new IconTabBar({ expandable: false, expanded: true });
    this.tabs.attachSelect(event => onActivate(event.getParameter("key") as string));
  }
  public open(info: OpenedApplication, content: Control): void {
    if (!this.filters.has(info.instanceId)) {
      const filter = new IconTabFilter({ key: info.instanceId, text: info.title, icon: info.icon, content: [content] });
      this.filters.set(info.instanceId, filter); this.tabs.addItem(filter);
    }
    this.activate(info.instanceId);
  }
  public close(id: string): void { const filter = this.filters.get(id); if (!filter) return; this.tabs.removeItem(filter); filter.destroy(); this.filters.delete(id); }
  public closeAll(): void { [...this.filters.keys()].forEach(id => this.close(id)); }
  public activate(id: string): void { this.tabs.setSelectedKey(id); }
  public getControl(): Control { return this.tabs; }
}
