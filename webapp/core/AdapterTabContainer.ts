import Control from "sap/ui/core/Control";
import TabContainer from "sap/m/TabContainer";
import TabContainerItem from "sap/m/TabContainerItem";
import { OpenedApplication } from "./models";

/** UI5 reference container with native closable SAPUI5 tabs. */
export default class AdapterTabContainer {
  private readonly tabs = new TabContainer();
  private readonly items = new Map<string, TabContainerItem>();
  private selecting = false;
  public constructor(onActivate: (id: string) => void, onClose: (id: string) => void) {
    this.tabs.attachItemSelect(event => {
      const item = event.getParameter("item") as TabContainerItem;
      // TabContainer may fire this event without an item while the selected
      // item is being removed. That is a container lifecycle event, not a
      // user activation request.
      if (!this.selecting && item) onActivate(item.getKey());
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
  public close(id: string): void {
    const item = this.items.get(id);
    if (!item) return;
    this.selecting = true;
    try {
      this.tabs.removeItem(item);
      item.destroy();
      this.items.delete(id);
    } finally {
      this.selecting = false;
    }
  }
  public closeAll(): void { [...this.items.keys()].forEach(id => this.close(id)); }
  public activate(id: string): void {
    const item = this.items.get(id);
    // TabContainer fires itemSelect for programmatic selection too. Avoid
    // selecting the already active item again, otherwise activate() recurses.
    if (item && this.tabs.getSelectedItem() !== id) {
      this.selecting = true;
      try { this.tabs.setSelectedItem(item); }
      finally { this.selecting = false; }
    }
  }
  public getControl(): Control { return this.tabs; }
}
