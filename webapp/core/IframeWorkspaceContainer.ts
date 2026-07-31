import Control from "sap/ui/core/Control";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import VBox from "sap/m/VBox";
import { OpenedApplication } from "./models";

/**
 * URL application workspace. Unlike the standard UI5 adapter, this does not
 * use IconTabBar: a segmented tab strip controls one dedicated iframe pane.
 */
export default class IframeWorkspaceContainer {
  private readonly tabs = new SegmentedButton({ width: "100%" }).addStyleClass("iframeWorkspaceTabStrip");
  private readonly contentArea = new VBox({ fitContainer: true }).addStyleClass("iframeWorkspaceContentPane");
  private readonly root = new VBox({ fitContainer: true, items: [this.tabs, this.contentArea] }).addStyleClass("iframeWorkspaceContainer");
  private readonly items = new Map<string, { tab: SegmentedButtonItem; content: Control }>();

  public constructor(private readonly onActivate: (id: string) => void) {
    this.tabs.attachSelectionChange(event => {
      const item = event.getParameter("item") as SegmentedButtonItem | undefined;
      if (item) this.onActivate(item.getKey());
    });
  }

  public open(info: OpenedApplication, content: Control): void {
    if (!this.items.has(info.instanceId)) {
      const tab = new SegmentedButtonItem({ key: info.instanceId, text: info.title, icon: info.icon });
      this.items.set(info.instanceId, { tab, content });
      this.tabs.addItem(tab);
    }
    this.activate(info.instanceId);
  }

  public close(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    if (this.tabs.getSelectedKey() === id) this.contentArea.removeAllItems();
    this.tabs.removeItem(entry.tab);
    entry.tab.destroy();
    this.items.delete(id);
  }

  public closeAll(): void { [...this.items.keys()].forEach(id => this.close(id)); }

  public activate(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    this.tabs.setSelectedKey(id);
    this.contentArea.removeAllItems();
    this.contentArea.addItem(entry.content);
  }

  public getControl(): Control { return this.root; }
}
