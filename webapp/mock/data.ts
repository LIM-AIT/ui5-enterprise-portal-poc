/** Runtime Mock data. data.json is retained as the portable seed-data artifact. */
const mock = {
  users: [{ id: "jane.doe", name: "Jane Doe", roles: ["PORTAL_USER", "FI_USER"] }],
  roles: ["PORTAL_USER", "FI_USER", "HR_USER", "APPROVER", "PORTAL_ADMIN"],
  menus: [
    { id: "home", title: "포털 홈", description: "공통 업무 홈", icon: "sap-icon://home", order: 10, applicationId: "ui5-sample", roles: ["PORTAL_USER"], active: true },
    { id: "fi-overview", parentId: "finance", title: "재무 현황", description: "FI sample component", icon: "sap-icon://money-bills", order: 20, applicationId: "ui5-sample", roles: ["FI_USER"], active: true },
    { id: "hr-help", parentId: "hr", title: "HR 안내", description: "iframe sample", icon: "sap-icon://employee", order: 30, applicationId: "iframe-sample", roles: ["HR_USER"], active: true },
    { id: "external", title: "외부 애플리케이션", description: "새 창 실행", icon: "sap-icon://action", order: 40, applicationId: "external-sample", roles: ["PORTAL_USER"], active: true },
    { id: "vendor-quotation", parentId: "procurement", title: "협력사 견적 조회", description: "Non-SAP iframe으로 견적 정보를 조회합니다.", icon: "sap-icon://internet-browser", order: 45, applicationId: "iframe-sample", roles: ["PORTAL_USER"], active: true },
    { id: "react-procurement", parentId: "procurement", title: "React 견적 대시보드", description: "React 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", order: 46, applicationId: "react-procurement-app", roles: ["PORTAL_USER"], active: true },
    { id: "purchase-request", parentId: "procurement", title: "구매요청 등록", description: "구매요청을 등록하고 승인 흐름을 시작합니다.", icon: "sap-icon://cart", order: 50, applicationId: "purchase-request-app", roles: ["PORTAL_USER"], active: true },
    { id: "budget-review", parentId: "procurement", title: "FI 예산검토", description: "구매요청의 예산 적정성을 검토합니다.", icon: "sap-icon://money-bills", order: 60, applicationId: "budget-review-app", roles: ["FI_USER"], active: true },
    { id: "approval-worklist", parentId: "procurement", title: "구매승인함", description: "예산검토 완료 요청을 승인하거나 반려합니다.", icon: "sap-icon://task", order: 70, applicationId: "approval-worklist-app", roles: ["APPROVER"], active: true },
    { id: "admin", title: "관리자 설정", description: "CUSTOM_HANDLER extension point", icon: "sap-icon://settings", order: 90, applicationId: "admin-sample", roles: ["PORTAL_ADMIN"], active: true }
  ],
  applications: [
    { id: "ui5-sample", title: "SAPUI5 Component 샘플", description: "동일 UI5 런타임에서 실행되는 컴포넌트", icon: "sap-icon://product", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.ui5", navigationMode: "TAB", roles: ["PORTAL_USER", "FI_USER"], parameters: {}, active: true },
    { id: "iframe-sample", title: "협력사 견적 조회", description: "Non-SAP sandboxed iframe integration", icon: "sap-icon://internet-browser", applicationType: "IFRAME", target: "iframe-sample.html", navigationMode: "TAB", roles: ["PORTAL_USER", "HR_USER"], parameters: {}, active: true },
    { id: "react-procurement-app", title: "React 견적 대시보드", description: "React 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", applicationType: "IFRAME", target: "/non-sap/react-procurement/", navigationMode: "TAB", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "external-sample", title: "새 창 샘플", description: "external window", icon: "sap-icon://action", applicationType: "EXTERNAL_WINDOW", target: "https://www.sap.com", navigationMode: "NEW_WINDOW", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "purchase-request-app", title: "구매요청 등록", description: "요청자 구매요청 등록 UI5 앱", icon: "sap-icon://cart", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.purchaseRequest", navigationMode: "TAB", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "budget-review-app", title: "FI 예산검토", description: "예산 검토 작업함", icon: "sap-icon://money-bills", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.budgetReview", navigationMode: "TAB", roles: ["FI_USER"], parameters: {}, active: true },
    { id: "approval-worklist-app", title: "구매승인함", description: "결재자 승인 작업함", icon: "sap-icon://task", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.approvalWorklist", navigationMode: "TAB", roles: ["APPROVER"], parameters: {}, active: true },
    { id: "admin-sample", title: "관리자 설정", description: "등록/수정 handler", icon: "sap-icon://settings", applicationType: "CUSTOM_HANDLER", target: "portal-admin", navigationMode: "TAB", roles: ["PORTAL_ADMIN"], parameters: {}, active: true }
  ]
};
export default mock;
