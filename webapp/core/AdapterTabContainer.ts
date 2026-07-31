import Control from "sap/ui/core/Control";
import TabContainer from "sap/m/TabContainer";
import TabContainerItem from "sap/m/TabContainerItem";
import { OpenedApplication } from "./models";

/** UI5 reference container with native closable SAPUI5 tabs. */
export default class AdapterTabContainer {
  private readonly tabs = new TabContainer();
  private readonly items = new Map<string, TabContainerItem>();
  public constructor(onActivate: (id: string) => void, onClose: (id: string) => void) {
    this.tabs.attachItemSelect(event => {
      const item = event.getParameter("item") as TabContainerItem;
      onActivate(item.getKey());
    });
    this.tabs.attachItemClose(event => {
      event.preventDefault();
      const item = event.getParameter("item") as TabContainerItem;
      onClose(item.getKey());
    });
  }
  public open(info: OpenedApplication, content: Control): void {
    if (!this.items.has(info.instanceId)) {
      const item = new TabContainerItem({ key: info.instanceId, name: info.title, icon: info.icon, content: [content] });
      this.items.set(info.instanceId, item); this.tabs.addItem(item);
    }
    this.activate(info.instanceId);
  }
  public close(id: string): void { const item = this.items.get(id); if (!item) return; this.tabs.removeItem(item); item.destroy(); this.items.delete(id); }
  public closeAll(): void { [...this.items.keys()].forEach(id => this.close(id)); }
  public activate(id: string): void { const item = this.items.get(id); if (item) this.tabs.setSelectedItem(item); }
  public getControl(): Control { return this.tabs; }
}
