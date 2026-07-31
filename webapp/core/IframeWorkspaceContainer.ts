import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";
import VBox from "sap/m/VBox";
import { OpenedApplication } from "./models";

/**
 * URL application workspace. Unlike the standard UI5 adapter, this does not
 * use IconTabBar: a compact, horizontally scrollable tab strip controls one
 * dedicated iframe pane. Tab widths follow their labels instead of splitting
 * the entire workspace evenly.
 */
export default class IframeWorkspaceContainer {
  private readonly tabs = new FlexBox({ wrap: "NoWrap", alignItems: "Center" }).addStyleClass("iframeWorkspaceTabStrip");
  private readonly contentArea = new VBox({ fitContainer: true }).addStyleClass("iframeWorkspaceContentPane");
  private readonly root = new VBox({ fitContainer: true, items: [this.tabs, this.contentArea] }).addStyleClass("iframeWorkspaceContainer");
  private readonly items = new Map<string, { tab: HBox; content: Control }>();

  public constructor(
    private readonly onActivate: (id: string) => void,
    private readonly onClose: (id: string) => void
  ) {}

  public open(info: OpenedApplication, content: Control): void {
    if (!this.items.has(info.instanceId)) {
      const openButton = new Button({
        text: info.title,
        icon: info.icon,
        type: "Transparent",
        tooltip: info.title,
        press: () => this.onActivate(info.instanceId)
      }).addStyleClass("iframeWorkspaceTabOpen");
      const closeButton = new Button({
        icon: "sap-icon://decline",
        type: "Transparent",
        tooltip: `${info.title} 탭 닫기`,
        press: () => this.onClose(info.instanceId)
      }).addStyleClass("iframeWorkspaceTabClose");
      const tab = new HBox({ alignItems: "Center", items: [openButton, closeButton] }).addStyleClass("iframeWorkspaceTab");
      this.items.set(info.instanceId, { tab, content });
      this.tabs.addItem(tab);
    }
    this.activate(info.instanceId);
  }

  public close(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    this.tabs.removeItem(entry.tab);
    entry.tab.destroy();
    this.items.delete(id);
  }

  public closeAll(): void { [...this.items.keys()].forEach(id => this.close(id)); }

  public activate(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    this.items.forEach(item => item.tab.removeStyleClass("iframeWorkspaceTabActive"));
    entry.tab.addStyleClass("iframeWorkspaceTabActive");
    this.contentArea.removeAllItems();
    this.contentArea.addItem(entry.content);
  }

  public getControl(): Control { return this.root; }
}
