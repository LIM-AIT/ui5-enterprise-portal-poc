import { ApplicationConfig, MenuItem } from "./models";
import Ui5TabWorkspaceAdapter from "./Ui5TabWorkspaceAdapter";
import IframeWorkspaceAdapter from "./IframeWorkspaceAdapter";
import CustomWorkspaceAdapter from "./CustomWorkspaceAdapter";
import { WorkspaceAdapter, WorkspaceAdapterKey } from "./WorkspaceAdapter";
import Control from "sap/ui/core/Control";
import EventBus from "sap/ui/core/EventBus";
import mock from "../mock/data";
import ApplicationLauncher from "./ApplicationLauncher";
import PortalMessageBroker from "./PortalMessageBroker";
import MockIdentityProvider from "./IdentityProvider";

type AuditRecord = { timestamp: string; category: "EXECUTION" | "MESSAGE"; title: string; description: string; icon: string };

export default class PortalController {
  private role = "PORTAL_USER";
  private collection = "menu";
  private query = "";
  private favorites = ["ui5-sample"];
  private recent: string[] = [];
  private userId = "jane.doe";
  private lastMessage = "";
  private adminOpen = false;
  private activeInstanceId?: string;
  private auditRecords: AuditRecord[] = [];
  private readonly messageListeners = new Set<() => void>();
  private workspace: WorkspaceAdapter = new Ui5TabWorkspaceAdapter();
  private broker = new PortalMessageBroker(EventBus.getInstance());
  private launcher = new ApplicationLauncher(this.workspace, this.broker);
  private readonly identity = new MockIdentityProvider();
  private apps = mock.applications as ApplicationConfig[];
  private menus = mock.menus as MenuItem[];

  public constructor() {
    this.launcher.registerCustomHandler("portal-admin", app => this.workspace.open(app));
    this.broker.subscribe("*", message => {
      this.recordAudit("MESSAGE", `${message.source} → ${message.target}`, message.eventType, "sap-icon://discussion-2");
      this.workspace.sendMessage(message);
    });
    this.broker.subscribe("portal", message => {
      this.lastMessage = `메시지 수신 · ${message.source} / ${message.eventType}`;
      this.workspace.sendMessage(this.broker.create("portal", message.source, "PORTAL_MESSAGE_ACK", {
        receivedEventType: message.eventType,
        messageId: message.messageId
      }));
      this.messageListeners.forEach(listener => listener());
    });
  }

  public onMessage(listener: () => void): void { this.messageListeners.add(listener); }
  public setRole(r: string): void { this.role = r; }
  public search(q: string): void { this.query = q.toLowerCase(); }
  public selectCollection(c: string): void { this.collection = c; }
  public async toggleFavorite(menuId: string): Promise<void> {
    const applicationId = this.menus.find(menu => menu.id === menuId)?.applicationId;
    if (!applicationId) return;
    this.favorites = this.favorites.includes(applicationId) ? this.favorites.filter(id => id !== applicationId) : [...this.favorites, applicationId];
    await this.savePersonalization();
  }
  public async openMenu(id: string): Promise<void> {
    const menu = this.menus.find(x => x.id === id);
    const app = this.apps.find(x => x.id === menu?.applicationId);
    if (!app || !this.authorized(app.roles)) return;
    await this.launcher.launch(app);
    if (app.applicationType !== "EXTERNAL_WINDOW") this.activeInstanceId = app.id;
    this.recent = [app.id, ...this.recent.filter(x => x !== app.id)].slice(0, 5);
    void this.savePersonalization();
    this.lastMessage = app.applicationType === "EXTERNAL_WINDOW"
      ? `새 창으로 실행됨 · ${app.title}`
      : `Workspace 활성화 · ${app.title}`;
    this.recordAudit("EXECUTION", app.title, `${app.applicationType} · ${app.navigationMode}`, "sap-icon://activity-items");
    this.messageListeners.forEach(listener => listener());
  }
  public sendTestMessageToActive(): void {
    if (!this.activeInstanceId) throw new Error("메시지를 받을 Workspace 애플리케이션이 없습니다.");
    const application = this.apps.find(app => app.id === this.activeInstanceId);
    if (!application) throw new Error("활성 애플리케이션 정보를 찾을 수 없습니다.");
    this.broker.publish(this.broker.create("portal", application.id, "PORTAL_TEST_MESSAGE", {
      text: "Portal Shell에서 보낸 테스트 메시지",
      applicationId: application.id
    }));
    this.lastMessage = `메시지 전송 · Portal → ${application.title}`;
    this.messageListeners.forEach(listener => listener());
  }
  public activate(id: string): void { this.workspace.activate(id); this.activeInstanceId = id; }
  public closeActive(): void {
    if (!this.activeInstanceId) return;
    this.workspace.close(this.activeInstanceId);
    this.activeInstanceId = this.workspace.getOpenedApplications()[0]?.instanceId;
  }
  public closeAll(): void { this.workspace.closeAll(); this.activeInstanceId = undefined; }
  public setWorkspaceAdapter(key: WorkspaceAdapterKey): void {
    this.workspace.closeAll();
    this.activeInstanceId = undefined;
    this.workspace = key === "IFRAME" ? new IframeWorkspaceAdapter() : key === "CUSTOM" ? new CustomWorkspaceAdapter() : new Ui5TabWorkspaceAdapter();
    this.launcher.setWorkspaceAdapter(this.workspace);
  }
  public setAdminOpen(open: boolean): void { this.adminOpen = open; }
  public getWorkspaceControl(): Control | undefined { return this.workspace.getWorkspaceControl(); }
  public getActiveControl(): Control | undefined { return this.workspace.getActiveControl(); }
  public getViewState(): object {
    return {
      currentRole: this.role,
      currentCollection: this.collection,
      visibleMenus: this.visibleMenus(),
      menuTree: this.menuTree(),
      dashboardQuickLaunch: this.visibleMenus().slice(0, 4),
      dashboardFavorites: this.dashboardItems(this.favorites),
      dashboardRecent: this.dashboardItems(this.recent),
      applicationCatalog: this.applicationCatalog(),
      workspaceAdapterInfo: this.workspaceAdapterInfo(),
      auditRecords: this.auditRecords,
      openedApplications: this.workspace.getOpenedApplications(),
      lastMessage: this.lastMessage,
      adminOpen: this.adminOpen,
      workspaceAdapter: this.workspace.key
    };
  }
  /** Returns UI-editable copies; changes are applied only through saveAdminState. */
  public getAdminState(): object {
    return {
      menus: this.menus.map(menu => ({ ...menu, rolesText: menu.roles.join(", ") })),
      applications: this.apps.map(app => ({ ...app, rolesText: app.roles.join(", ") }))
    };
  }
  /** Loads the runtime configuration through the Portal configuration API. */
  public async loadConfiguration(): Promise<void> {
    const response = await fetch("/api/portal/config");
    if (!response.ok) throw new Error("Portal configuration API is unavailable.");
    const configuration = await response.json() as { menus: MenuItem[]; applications: ApplicationConfig[]; favorites?: Array<{ userId: string; applicationId: string }>; recent?: Array<{ userId: string; applicationId: string; executedAt: string }> };
    this.menus = configuration.menus;
    this.apps = configuration.applications;
    this.favorites = configuration.favorites?.filter(item => item.userId === this.userId).map(item => item.applicationId) ?? [];
    this.recent = configuration.recent?.filter(item => item.userId === this.userId).sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()).map(item => item.applicationId) ?? [];
  }
  public async loadIdentity(): Promise<void> { this.userId = (await this.identity.getCurrentUser()).id; }
  /** Mock CRUD boundary. Replace this with a protected configuration API in a productive deployment. */
  public async saveAdminState(state: { menus: Array<MenuItem & { rolesText?: string }>; applications: Array<ApplicationConfig & { rolesText?: string }> }): Promise<void> {
    const applications = state.applications.map(app => ({
      ...app,
      id: app.id.trim(), title: app.title.trim(), target: app.target.trim(),
      roles: this.parseRoles(app.rolesText, app.roles), parameters: app.parameters ?? {},
      navigationMode: app.navigationMode ?? (app.applicationType === "EXTERNAL_WINDOW" ? "NEW_WINDOW" : "TAB")
    }));
    const menus = state.menus.map(menu => ({
      ...menu,
      id: menu.id.trim(), title: menu.title.trim(), parentId: menu.parentId?.trim() || undefined,
      applicationId: menu.applicationId?.trim() || undefined, order: Number(menu.order),
      roles: this.parseRoles(menu.rolesText, menu.roles)
    }));
    if ([...applications, ...menus].some(item => !item.id || !item.title)) throw new Error("ID와 제목은 필수입니다.");
    if (new Set(applications.map(app => app.id)).size !== applications.length) throw new Error("애플리케이션 ID가 중복되었습니다.");
    if (new Set(menus.map(menu => menu.id)).size !== menus.length) throw new Error("메뉴 ID가 중복되었습니다.");
    if (menus.some(menu => !Number.isFinite(menu.order))) throw new Error("메뉴 순서는 숫자여야 합니다.");
    const appIds = new Set(applications.map(app => app.id));
    if (menus.some(menu => menu.active && (!menu.applicationId || !appIds.has(menu.applicationId)))) throw new Error("활성 메뉴에는 등록된 Application ID가 필요합니다.");
    const response = await fetch("/api/portal/config", { method: "PUT", headers: { "Content-Type": "application/json", "x-portal-role": this.role }, body: JSON.stringify({ menus, applications }) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(result.message ?? "Failed to save portal configuration.");
    }
    const configuration = await response.json() as { menus: MenuItem[]; applications: ApplicationConfig[] };
    this.apps = configuration.applications;
    this.menus = configuration.menus;
  }
  private visibleMenus(): Array<MenuItem & { favorite: boolean }> {
    let source = this.menus.filter(m => m.active && this.authorized(m.roles) && m.applicationId);
    if (this.collection === "favorites") source = source.filter(m => this.favorites.includes(m.applicationId!));
    if (this.collection === "recent") source = source.filter(m => this.recent.includes(m.applicationId!));
    return source.filter(m => !this.query || `${m.title} ${m.description}`.toLowerCase().includes(this.query)).sort((a, b) => a.order - b.order).map(menu => ({ ...menu, favorite: this.favorites.includes(menu.applicationId!) }));
  }
  /** Converts per-user application history into launchable and role-filtered dashboard cards. */
  private dashboardItems(applicationIds: string[]): Array<MenuItem & { favorite: boolean }> {
    return applicationIds.map(applicationId => this.menus
      .filter(menu => menu.active && menu.applicationId === applicationId && this.authorized(menu.roles))
      .sort((a, b) => a.order - b.order)[0])
      .filter((menu): menu is MenuItem => Boolean(menu))
      .map(menu => ({ ...menu, favorite: this.favorites.includes(menu.applicationId!) }));
  }
  /** Catalog data deliberately joins application metadata with the role-authorized launch menu. */
  private applicationCatalog(): Array<MenuItem & Pick<ApplicationConfig, "applicationType" | "navigationMode">> {
    return this.apps.filter(app => app.active && this.authorized(app.roles)).map(app => {
      const menu = this.menus.filter(item => item.active && item.applicationId === app.id && this.authorized(item.roles)).sort((a, b) => a.order - b.order)[0];
      return menu ? { ...menu, applicationType: app.applicationType, navigationMode: app.navigationMode } : undefined;
    }).filter((item): item is MenuItem & Pick<ApplicationConfig, "applicationType" | "navigationMode"> => Boolean(item));
  }
  private workspaceAdapterInfo(): { label: string; description: string; supportedApplications: string; visualCue: string } {
    const infos: Record<WorkspaceAdapterKey, { label: string; description: string; supportedApplications: string; visualCue: string }> = {
      UI5_TAB: {
        label: "기본 UI5 통합 탭",
        description: "SAPUI5 Component와 iframe 앱을 하나의 표준 UI5 탭 Workspace에서 함께 실행합니다.",
        supportedApplications: "지원: UI5 Component · iframe · Custom Handler",
        visualCue: "기본 UI5 탭"
      },
      IFRAME: {
        label: "Non-SAP iframe 전용 탭",
        description: "URL 기반 Non-SAP 앱을 iframe 탭으로 실행하는 연계 방식을 검증합니다.",
        supportedApplications: "지원: React · Vue · HTML · Nexacro(웹 URL)",
        visualCue: "iframe 전용"
      },
      CUSTOM: {
        label: "고객사 Custom MDI 어댑터",
        description: "고객사의 기존 MDI 또는 커스텀 탭 컨트롤을 연결하기 위한 확장 구조입니다.",
        supportedApplications: "지원: 고객사 Tab Control API 연동",
        visualCue: "보라색 확장 영역"
      }
    };
    return infos[this.workspace.key];
  }
  private recordAudit(category: AuditRecord["category"], title: string, description: string, icon: string): void {
    this.auditRecords = [{ timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), category, title, description, icon }, ...this.auditRecords].slice(0, 20);
  }
  private menuTree(): Array<MenuItem & { children: Array<MenuItem & { favorite: boolean }> }> {
    const groupLabels: Record<string, { title: string; icon: string; order: number }> = {
      common: { title: "공통 업무", icon: "sap-icon://home", order: 10 },
      finance: { title: "재무 업무", icon: "sap-icon://money-bills", order: 20 },
      hr: { title: "인사 업무", icon: "sap-icon://employee", order: 30 }
      , procurement: { title: "구매 업무", icon: "sap-icon://cart", order: 40 }
    };
    const groups = new Map<string, Array<MenuItem & { favorite: boolean }>>();
    this.menus.filter(menu => menu.active && this.authorized(menu.roles) && menu.applicationId).filter(menu => !this.query || `${menu.title} ${menu.description}`.toLowerCase().includes(this.query)).forEach(menu => {
      const groupId = menu.parentId || "common";
      const children = groups.get(groupId) ?? [];
      children.push({ ...menu, favorite: this.favorites.includes(menu.applicationId!) });
      groups.set(groupId, children);
    });
    return [...groups.entries()].map(([groupId, children]) => {
      const group = groupLabels[groupId] ?? { title: groupId, icon: "sap-icon://folder-blank", order: 99 };
      return { id: `group-${groupId}`, title: group.title, description: `${children.length} applications`, icon: group.icon, order: group.order, roles: [], active: true, children: children.sort((a, b) => a.order - b.order) };
    }).sort((a, b) => a.order - b.order);
  }
  /** The role selector is a strict single-role demo; productive identity can supply multiple effective roles later. */
  private authorized(roles: string[]): boolean { return roles.includes(this.role); }
  private parseRoles(rolesText: string | undefined, fallback: string[]): string[] {
    const roles = (rolesText ?? fallback.join(",")).split(",").map(role => role.trim()).filter(Boolean);
    if (!roles.length) throw new Error("역할을 하나 이상 지정하세요.");
    return [...new Set(roles)];
  }
  private async savePersonalization(): Promise<void> {
    const response = await fetch(`/api/portal/users/${encodeURIComponent(this.userId)}/personalization`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorites: this.favorites, recent: this.recent }) });
    if (!response.ok) throw new Error("Failed to save personalization.");
  }
}
