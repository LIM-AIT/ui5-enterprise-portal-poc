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
import LocalTrialAssistantProvider from "../core/PortalAssistant";
import { AssistantBusinessContext, AssistantCard, AssistantContext } from "../core/AssistantProvider";

type AssistantMessage = { id: string; role: "assistant" | "user"; roleLabel: string; text: string; time: string; card?: AssistantCard; actionMenuId?: string; actionLabel?: string };
type AssistantSuggestion = { title: string; prompt: string; icon: string };

export default class App extends Controller {
  private portal!: PortalController;
  private activityPopover?: Popover;
  private activityModel = new JSONModel({ records: [] });
  private assistant = new LocalTrialAssistantProvider();
  private assistantModel = new JSONModel();
  public onInit(): void {
    this.portal = (this.getOwnerComponent() as unknown as { portal: PortalController }).portal;
    this.getView()!.setModel(this.assistantModel, "assistant");
    this.initializeAssistant();
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
  public onTabSelect(e: Event): void { this.portal.activate((e as any).getParameter("key")); this.refresh(); this.renderActive(); }
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
  public onToggleAssistant(): void {
    const open = !this.assistantModel.getProperty("/open");
    this.assistantModel.setProperty("/open", open);
    this.updateAssistantContext();
    if (open) this.scrollAssistantConversation();
  }
  public onCloseAssistant(): void { this.assistantModel.setProperty("/open", false); }
  public onAssistantSuggestion(e: Event): void {
    const suggestion = (e as any).getSource().getBindingContext("assistant")?.getObject() as AssistantSuggestion | undefined;
    if (suggestion?.prompt) void this.submitAssistantPrompt(suggestion.prompt);
  }
  public onAssistantSend(): void {
    const draft = String(this.assistantModel.getProperty("/draft") ?? "").trim();
    if (draft) void this.submitAssistantPrompt(draft);
  }
  public async onAssistantAction(e: Event): Promise<void> {
    const message = (e as any).getSource().getBindingContext("assistant")?.getObject() as AssistantMessage | undefined;
    if (!message?.actionMenuId) return;
    await this.openDashboardMenu(message.actionMenuId);
    this.updateAssistantContext();
  }
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
    const application = { id: `app-${Date.now()}`, title: "새 애플리케이션", description: "", icon: "sap-icon://product", applicationType: "IFRAME", target: "", navigationMode: "TAB", rolesText: "PORTAL_USER", parameters: {}, active: true };
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
  private refresh(): void {
    ((this.getView() as any).getModel("portal") as JSONModel).setData(this.portal.getViewState());
    this.updateAssistantContext();
  }
  private initializeAssistant(): void {
    const context = this.assistantContext();
    const state = this.portal.getViewState() as { userName: string };
    const suggestions: AssistantSuggestion[] = [
      { title: "최저 견적 요약", prompt: "최저 견적 협력사를 요약해줘", icon: "sap-icon://money-bills" },
      { title: "구매요청 등록 안내", prompt: "구매요청 등록 방법을 알려줘", icon: "sap-icon://cart" },
      { title: "승인 대기 업무", prompt: "현재 승인 대기 업무를 확인하고 싶어", icon: "sap-icon://task" },
      { title: "메뉴 찾아보기", prompt: "현재 역할에서 사용할 수 있는 메뉴를 알려줘", icon: "sap-icon://search" }
    ];
    this.assistantModel.setData({
      open: false,
      busy: false,
      draft: "",
      role: context.role,
      roleLabel: context.roleLabel,
      contextTitle: this.assistantContextTitle(context),
      contextDetail: this.assistantContextDetail(context),
      suggestions,
      messages: [{
        id: "assistant-welcome",
        role: "assistant",
        roleLabel: "AI 업무 도우미",
        text: `안녕하세요, ${state.userName}님. 현재 역할과 Workspace 문맥을 바탕으로 메뉴 탐색, 견적 비교와 업무 절차를 도와드릴게요.`,
        time: this.assistantTime()
      } satisfies AssistantMessage]
    });
  }
  private async submitAssistantPrompt(prompt: string): Promise<void> {
    if (this.assistantModel.getProperty("/busy")) return;
    const messages = [...(this.assistantModel.getProperty("/messages") as AssistantMessage[])];
    messages.push({ id: `user-${Date.now()}`, role: "user", roleLabel: "임우상", text: prompt, time: this.assistantTime() });
    this.assistantModel.setProperty("/messages", messages);
    this.assistantModel.setProperty("/draft", "");
    this.assistantModel.setProperty("/busy", true);
    this.scrollAssistantConversation();
    try {
      const reply = await this.assistant.respond(prompt, this.assistantContext());
      const updated = [...(this.assistantModel.getProperty("/messages") as AssistantMessage[])];
      updated.push({ id: `assistant-${Date.now()}`, role: "assistant", roleLabel: "AI 업무 도우미", text: reply.text, time: this.assistantTime(), card: reply.card, actionMenuId: reply.actionMenuId, actionLabel: reply.actionLabel });
      this.assistantModel.setProperty("/messages", updated);
    } finally {
      this.assistantModel.setProperty("/busy", false);
      this.scrollAssistantConversation();
    }
  }
  private assistantContext(): AssistantContext {
    const state = this.portal.getViewState() as {
      currentRole: string;
      activeApplicationId: string;
      adminOpen: boolean;
      applicationCatalog: Array<{ id: string; title: string; description: string }>;
      dashboardRecent: Array<{ id: string; title: string; description: string }>;
      openedApplications: Array<{ instanceId: string; applicationId: string; title: string }>;
      activeBusinessContext?: AssistantBusinessContext;
    };
    const roleLabels: Record<string, string> = { PORTAL_USER: "포털 사용자", FI_USER: "재무 담당자", HR_USER: "인사 담당자", APPROVER: "승인 담당자", PORTAL_ADMIN: "포털 관리자" };
    const active = state.openedApplications.find(item => item.instanceId === state.activeApplicationId || item.applicationId === state.activeApplicationId);
    return {
      role: state.currentRole,
      roleLabel: roleLabels[state.currentRole] ?? state.currentRole,
      activeTitle: state.adminOpen ? "Portal 관리자 설정" : active?.title ?? "포털 홈",
      menus: state.applicationCatalog.map(item => ({ id: item.id, title: item.title, description: item.description })),
      recent: state.dashboardRecent.map(item => ({ id: item.id, title: item.title, description: item.description })),
      businessContext: state.activeBusinessContext
    };
  }
  private updateAssistantContext(): void {
    if (!this.assistantModel.getData()) return;
    const context = this.assistantContext();
    this.assistantModel.setProperty("/role", context.role);
    this.assistantModel.setProperty("/roleLabel", context.roleLabel);
    this.assistantModel.setProperty("/contextTitle", this.assistantContextTitle(context));
    this.assistantModel.setProperty("/contextDetail", this.assistantContextDetail(context));
  }
  private assistantContextTitle(context: AssistantContext): string {
    if (!context.businessContext || context.businessContext.title === context.activeTitle) return context.activeTitle;
    return `${context.activeTitle} · ${context.businessContext.title}`;
  }
  private assistantContextDetail(context: AssistantContext): string {
    if (!context.businessContext) return `실행 가능한 업무 ${context.menus.length}개`;
    return [context.businessContext.entityId, context.businessContext.summary].filter(Boolean).join(" · ");
  }
  private assistantTime(): string { return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }); }
  private scrollAssistantConversation(): void {
    window.setTimeout(() => {
      const conversation = this.byId("assistantConversation") as any;
      conversation?.scrollTo(0, 100000, 0);
      const scroller = conversation?.getDomRef()?.querySelector(".sapMScrollContScroll") as HTMLElement | undefined;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }, 80);
  }
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
