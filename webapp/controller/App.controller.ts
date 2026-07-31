import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import VBox from "sap/m/VBox";
import Tree from "sap/m/Tree";
import List from "sap/m/List";
import Event from "sap/ui/base/Event";
import MessageToast from "sap/m/MessageToast";
import Popover from "sap/m/Popover";
import StandardListItem from "sap/m/StandardListItem";
import PortalController from "../core/PortalController";

export default class App extends Controller {
  private portal!: PortalController;
  private activityPopover?: Popover;
  private activityModel = new JSONModel({ records: [] });
  public onInit(): void {
    this.portal = (this.getOwnerComponent() as unknown as { portal: PortalController }).portal;
    this.portal.onMessage(() => this.refresh());
    this.renderActive();
  }
  public onAfterRendering(): void { window.setTimeout(() => (this.byId("menuTree") as Tree)?.expandToLevel(2), 0); }
  public onRoleChange(e: Event): void { this.portal.setRole((e as any).getParameter("selectedItem").getKey()); this.portal.setAdminOpen(false); this.portal.closeAll(); this.refresh(); this.renderActive(); }
  public onSearch(e: Event): void { this.portal.search((e as any).getParameter("newValue")); this.refresh(); }
  public onNavSelect(e: Event): void { const item = (e as any).getParameter("item"); this.portal.selectCollection(item?.getKey?.() ?? (e as any).getParameter("key")); this.refresh(); }
  public async onMenuPress(e: Event): Promise<void> {
    const item = (e as any).getParameter("listItem").getBindingContext("portal")?.getObject() as { id: string };
    if (!item) return;
    // The administrator menu is a Portal capability, not a placeholder customer handler.
    if (item.id === "admin") { this.onOpenAdmin(); return; }
    if (item.id === "home") { this.onPortalHome(); return; }
    this.portal.setAdminOpen(false);
    try { await this.portal.openMenu(item.id); this.refresh(); this.renderActive(); } catch (error) { MessageToast.show(error instanceof Error ? error.message : "애플리케이션 실행에 실패했습니다."); }
  }
  public async onDashboardOpen(e: Event): Promise<void> {
    const item = (e as any).getSource().getBindingContext("portal")?.getObject() as { id?: string } | undefined;
    if (item?.id) await this.openDashboardMenu(item.id);
  }
  public async onCatalogOpen(e: Event): Promise<void> {
    const item = (e as any).getParameter("listItem").getBindingContext("portal")?.getObject() as { id?: string } | undefined;
    if (item?.id) await this.openDashboardMenu(item.id);
  }
  private async openDashboardMenu(id: string): Promise<void> {
    if (id === "admin") { this.onOpenAdmin(); return; }
    if (id === "home") { this.onPortalHome(); return; }
    this.portal.setAdminOpen(false);
    try { await this.portal.openMenu(id); this.refresh(); this.renderActive(); }
    catch (error) { MessageToast.show(error instanceof Error ? error.message : "애플리케이션 실행에 실패했습니다."); }
  }
  public async onToggleFavorite(e: Event): Promise<void> {
    const menu = (e as any).getSource().getBindingContext("portal")?.getObject() as { id: string };
    if (menu?.id) { try { await this.portal.toggleFavorite(menu.id); this.refresh(); } catch { MessageToast.show("즐겨찾기 저장에 실패했습니다."); } }
  }
  public onTabSelect(e: Event): void { this.portal.activate((e as any).getParameter("key")); this.renderActive(); }
  public onCloseActive(): void { this.portal.closeActive(); this.refresh(); this.renderActive(); }
  public onSendTestMessage(): void { try { this.portal.sendTestMessageToActive(); this.refresh(); MessageToast.show("활성 Workspace 앱으로 테스트 메시지를 전송했습니다."); } catch (error) { MessageToast.show(error instanceof Error ? error.message : "메시지 전송에 실패했습니다."); } }
  public onOpenActivityLog(e: Event): void {
    if (!this.activityPopover) {
      const list = new List({ items: { path: "activity>/records", template: new StandardListItem({ title: "{activity>title}", description: "{= ${activity>timestamp} + ' · ' + ${activity>description} }", icon: "{activity>icon}" }) } });
      this.activityPopover = new Popover({ title: "통합 메시지 및 실행 이력", contentWidth: "30rem", placement: "Bottom", content: [list] });
      this.activityPopover.setModel(this.activityModel, "activity");
      this.getView()!.addDependent(this.activityPopover);
    }
    this.activityModel.setProperty("/records", (this.portal.getViewState() as { auditRecords: unknown[] }).auditRecords);
    this.activityPopover.openBy((e as any).getSource());
  }
  public onCloseAll(): void { this.portal.closeAll(); this.refresh(); this.renderActive(); }
  public onPortalHome(): void { this.portal.setAdminOpen(false); this.portal.closeAll(); this.refresh(); this.renderActive(); }
  public onWorkspaceAdapterChange(e: Event): void { this.portal.setWorkspaceAdapter((e as any).getParameter("selectedItem").getKey()); this.refresh(); this.renderActive(); }
  public onOpenAdmin(): void {
    const state = this.portal.getAdminState() as any;
    state.selectedMenu = state.menus[0];
    state.selectedApplication = state.applications[0];
    this.getView()!.setModel(new JSONModel(state), "admin");
    this.portal.setAdminOpen(true);
    this.refresh();
  }
  public onCloseAdmin(): void { this.portal.setAdminOpen(false); this.refresh(); }
  public onAddMenu(): void {
    const model = this.adminModel(); const menus = model.getProperty("/menus") as any[];
    const applications = model.getProperty("/applications") as Array<{ id: string }>;
    const menu = { id: `menu-${Date.now()}`, title: "새 메뉴", parentId: "", description: "", icon: "sap-icon://folder", order: (menus.length + 1) * 10, applicationId: applications[0]?.id ?? "", rolesText: "PORTAL_USER", active: true };
    menus.push(menu); model.setProperty("/selectedMenu", menu);
    model.refresh(true);
  }
  public onAddApplication(): void {
    const model = this.adminModel(); const applications = model.getProperty("/applications") as any[];
    const application = { id: `app-${Date.now()}`, title: "새 애플리케이션", description: "", icon: "sap-icon://application", applicationType: "IFRAME", target: "", navigationMode: "TAB", rolesText: "PORTAL_USER", parameters: {}, active: true };
    applications.push(application); model.setProperty("/selectedApplication", application);
    model.refresh(true);
  }
  public onAdminMenuSelect(e: Event): void { this.adminModel().setProperty("/selectedMenu", (e as any).getParameter("listItem").getBindingContext("admin").getObject()); }
  public onAdminApplicationSelect(e: Event): void { this.adminModel().setProperty("/selectedApplication", (e as any).getParameter("listItem").getBindingContext("admin").getObject()); }
  public onDeleteSelectedMenu(): void { this.deleteSelectedEditorItem("adminMenuList", "/menus", "/selectedMenu", "메뉴"); }
  public onDeleteSelectedApplication(): void { this.deleteSelectedEditorItem("adminApplicationList", "/applications", "/selectedApplication", "애플리케이션"); }
  public async onSaveAdmin(): Promise<void> {
    try { await this.portal.saveAdminState(this.adminModel().getData()); this.onCloseAdmin(); MessageToast.show("Mock 설정이 API에 저장되고 Portal 메뉴에 반영되었습니다."); }
    catch (error) { MessageToast.show(error instanceof Error ? error.message : "설정 저장에 실패했습니다."); }
  }
  private adminModel(): JSONModel { return this.getView()!.getModel("admin") as JSONModel; }
  private deleteSelectedEditorItem(listId: string, collectionPath: string, selectionPath: string, label: string): void {
    const model = this.adminModel(); const selected = (this.byId(listId) as List).getSelectedItem()?.getBindingContext("admin")?.getObject() as { id?: string } | undefined;
    const items = model.getProperty(collectionPath) as Array<{ id: string }>;
    if (!selected?.id) { MessageToast.show(`삭제할 ${label}을 선택하세요.`); return; }
    const remaining = items.filter(item => item.id !== selected.id);
    model.setProperty(collectionPath, remaining); model.setProperty(selectionPath, remaining[0]); model.refresh(true);
  }
  private refresh(): void { ((this.getView() as any).getModel("portal") as JSONModel).setData(this.portal.getViewState()); }
  private renderActive(): void {
    const area = this.byId("workspaceContent") as VBox;
    area.removeAllItems();
    area.removeStyleClass("adapterWorkspaceUi5");
    area.removeStyleClass("adapterWorkspaceIframe");
    area.removeStyleClass("adapterWorkspaceCustom");
    const adapterClass: Record<string, string> = {
      UI5_TAB: "adapterWorkspaceUi5",
      IFRAME: "adapterWorkspaceIframe",
      CUSTOM: "adapterWorkspaceCustom"
    };
    const adapterKey = (this.getView()!.getModel("portal") as JSONModel).getProperty("/workspaceAdapter") as string;
    area.addStyleClass(adapterClass[adapterKey] || "adapterWorkspaceUi5");
    const control = this.portal.getWorkspaceControl();
    if (control) area.addItem(control);
  }
}
