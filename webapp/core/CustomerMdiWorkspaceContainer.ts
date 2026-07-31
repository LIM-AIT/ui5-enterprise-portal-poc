import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";
import Icon from "sap/ui/core/Icon";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import { OpenedApplication } from "./models";

/**
 * Customer-control simulation. The window strip and content pane are owned by
 * this container and intentionally do not reuse the standard IconTabBar.
 */
export default class CustomerMdiWorkspaceContainer {
  private readonly tabStrip = new FlexBox({ wrap: "Wrap", alignItems: "Center" }).addStyleClass("customerMdiTabStrip");
  private readonly contentArea = new VBox({ fitContainer: true }).addStyleClass("customerMdiContentPane");
  private readonly root = new VBox({ fitContainer: true, items: [
    new HBox({ alignItems: "Center", items: [
      new Icon({ src: "sap-icon://process" }),
      new Text({ text: "CUSTOM MDI WINDOW STRIP · 고객사 탭 컨트롤 대체 예시" })
    ] }).addStyleClass("customerMdiCaption"),
    this.tabStrip,
    this.contentArea
  ] }).addStyleClass("customerMdiWorkspaceContainer");
  private readonly items = new Map<string, { tab: Button; content: Control }>();

  public constructor(private readonly onActivate: (id: string) => void) {}

  public open(info: OpenedApplication, content: Control): void {
    if (!this.items.has(info.instanceId)) {
      const tab = new Button({ text: info.title, icon: info.icon, type: "Transparent", press: () => this.onActivate(info.instanceId) }).addStyleClass("customerMdiTab");
      this.items.set(info.instanceId, { tab, content });
      this.tabStrip.addItem(tab);
    }
    this.activate(info.instanceId);
  }

  public close(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    this.tabStrip.removeItem(entry.tab);
    entry.tab.destroy();
    this.items.delete(id);
    this.contentArea.removeAllItems();
  }

  public closeAll(): void { [...this.items.keys()].forEach(id => this.close(id)); }

  public activate(id: string): void {
    const entry = this.items.get(id);
    if (!entry) return;
    this.items.forEach(item => item.tab.setType("Transparent"));
    entry.tab.setType("Emphasized");
    this.contentArea.removeAllItems();
    this.contentArea.addItem(entry.content);
  }

  public getControl(): Control { return this.root; }
}
