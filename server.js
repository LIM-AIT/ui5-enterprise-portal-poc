const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use("/non-sap/react-procurement", express.static(path.join(__dirname, "non-sap", "react-procurement", "dist")));
app.use("/non-sap/vue-procurement", express.static(path.join(__dirname, "non-sap", "vue-procurement", "dist")));

// In-memory persistence for the PoC. Restarting the server resets the configuration.
const seed = {
  users: [{ id: "jane.doe", name: "Jane Doe", roles: ["PORTAL_USER", "FI_USER"] }],
  roles: ["PORTAL_USER", "FI_USER", "HR_USER", "APPROVER", "PORTAL_ADMIN"],
  menus: [
    { id: "home", title: "\uD3EC\uD138 \uD648", description: "Portal Dashboard\ub85c \ub3cc\uc544\uac11\ub2c8\ub2e4.", icon: "sap-icon://home", order: 10, applicationId: "ui5-sample", roles: ["PORTAL_USER"], active: true },
    { id: "fi-overview", parentId: "finance", title: "FI 전표 · 예산 현황", description: "S/4HANA FI 전표 조회", icon: "sap-icon://money-bills", order: 20, applicationId: "fi-ledger-app", roles: ["FI_USER"], active: true },
    { id: "hr-help", parentId: "hr", title: "HR \uC548\uB0B4", description: "HR \uc815\ucc45\uacfc \uc548\ub0b4 \uc870\ud68c", icon: "sap-icon://employee", order: 30, applicationId: "hr-guide-app", roles: ["HR_USER"], active: true },
    { id: "external", title: "\uC678\uBD80 \uC560\uD50C\uB9AC\uCF00\uC774\uC158", description: "\uC0C8 \uCC3D \uC2E4\uD589", icon: "sap-icon://action", order: 40, applicationId: "external-sample", roles: ["PORTAL_USER"], active: true },
    { id: "vendor-quotation", parentId: "procurement", title: "\uD611\uB825\uC0AC \uACAC\uC801 \uC870\uD68C", description: "Non-SAP iframe\uc73c\ub85c \uacac\uc801 \uc815\ubcf4\ub97c \uc870\ud68c\ud569\ub2c8\ub2e4.", icon: "sap-icon://internet-browser", order: 45, applicationId: "iframe-sample", roles: ["PORTAL_USER"], active: true },
    { id: "react-procurement", parentId: "procurement", title: "React 견적 대시보드", description: "React 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", order: 46, applicationId: "react-procurement-app", roles: ["PORTAL_USER"], active: true },
    { id: "vue-procurement", parentId: "procurement", title: "Vue 견적 대시보드", description: "Vue 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", order: 47, applicationId: "vue-procurement-app", roles: ["PORTAL_USER"], active: true },
    { id: "purchase-request", parentId: "procurement", title: "\uAD6C\uB9E4\uC694\uCCAD \uB4F1\uB85D", description: "\uAD6C\uB9E4\uC694\uCCAD\uC744 \uB4F1\uB85D\uD558\uACE0 \uC2B9\uC778 \uD750\uB984\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.", icon: "sap-icon://cart", order: 50, applicationId: "purchase-request-app", roles: ["PORTAL_USER"], active: true },
    { id: "budget-review", parentId: "procurement", title: "FI \uC608\uC0B0\uAC80\uD1A0", description: "\uAD6C\uB9E4\uC694\uCCAD\uC758 \uC608\uC0B0 \uC801\uC815\uC131\uC744 \uAC80\uD1A0\uD569\uB2C8\uB2E4.", icon: "sap-icon://money-bills", order: 60, applicationId: "budget-review-app", roles: ["FI_USER"], active: true },
    { id: "approval-worklist", parentId: "procurement", title: "\uAD6C\uB9E4\uC2B9\uC778\uD568", description: "\uC608\uC0B0\uAC80\uD1A0 \uC644\uB8CC \uC694\uCCAD\uC744 \uC2B9\uC778\uD558\uAC70\uB098 \uBC18\uB824\uD569\uB2C8\uB2E4.", icon: "sap-icon://task", order: 70, applicationId: "approval-worklist-app", roles: ["APPROVER"], active: true },
    { id: "admin", title: "\uAD00\uB9AC\uC790 \uC124\uC815", description: "Portal configuration", icon: "sap-icon://settings", order: 90, applicationId: "admin-sample", roles: ["PORTAL_ADMIN"], active: true }
  ],
  applications: [
    { id: "ui5-sample", title: "SAPUI5 \uAE30\uc220 \uc0d8\ud50c", description: "UI5 component in the same runtime", icon: "sap-icon://product", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.ui5", navigationMode: "TAB", roles: ["PORTAL_USER", "FI_USER"], parameters: { destinationName: "ui5-sample" }, active: true },
    { id: "fi-ledger-app", title: "FI 전표 · 예산 현황", description: "SAPUI5 FI List Report", icon: "sap-icon://money-bills", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.fiLedger", navigationMode: "TAB", roles: ["FI_USER"], parameters: {}, active: true },
    { id: "iframe-sample", title: "\uD611\uB825\uC0AC \uACAC\uC801 \uC870\uD68C", description: "Non-SAP sandboxed iframe integration", icon: "sap-icon://internet-browser", applicationType: "IFRAME", target: "iframe-sample.html", navigationMode: "TAB", roles: ["PORTAL_USER", "HR_USER"], parameters: { destinationName: "iframe-sample" }, active: true },
    { id: "hr-guide-app", title: "HR \uC548\uB0B4", description: "HR \uc815\ucc45 \uc548\ub0b4 iframe", icon: "sap-icon://employee", applicationType: "IFRAME", target: "hr-guide.html", navigationMode: "TAB", roles: ["HR_USER"], parameters: {}, active: true },
    { id: "react-procurement-app", title: "React 견적 대시보드", description: "React 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", applicationType: "IFRAME", target: "/non-sap/react-procurement/", navigationMode: "TAB", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "vue-procurement-app", title: "Vue 견적 대시보드", description: "Vue 기반 Non-SAP 견적 비교 앱", icon: "sap-icon://business-objects-experience", applicationType: "IFRAME", target: "/non-sap/vue-procurement/", navigationMode: "TAB", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "external-sample", title: "\uC0C8 \uCC3D \uC0D8\uD50C", description: "external window", icon: "sap-icon://action", applicationType: "EXTERNAL_WINDOW", target: "https://www.sap.com", navigationMode: "NEW_WINDOW", roles: ["PORTAL_USER"], parameters: { destinationName: "external-sample" }, active: true },
    { id: "purchase-request-app", title: "\uAD6C\uB9E4\uC694\uCCAD \uB4F1\uB85D", description: "\uC694\uCCAD\uC790 \uAD6C\uB9E4\uC694\uCCAD \uB4F1\uB85D UI5 \uC571", icon: "sap-icon://cart", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.purchaseRequest", navigationMode: "TAB", roles: ["PORTAL_USER"], parameters: {}, active: true },
    { id: "budget-review-app", title: "FI \uC608\uC0B0\uAC80\uD1A0", description: "\uC608\uC0B0 \uAC80\uD1A0 \uC791\uC5C5\ud568", icon: "sap-icon://money-bills", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.budgetReview", navigationMode: "TAB", roles: ["FI_USER"], parameters: {}, active: true },
    { id: "approval-worklist-app", title: "\uAD6C\uB9E4\uC2B9\uC778\uD568", description: "\uACB0\uC7AC\uC790 \uC2B9\uC778 \uC791\uC5C5\ud568", icon: "sap-icon://task", applicationType: "UI5_COMPONENT", target: "com.acme.portal.framework.samples.approvalWorklist", navigationMode: "TAB", roles: ["APPROVER"], parameters: {}, active: true },
    { id: "admin-sample", title: "\uAD00\uB9AC\uC790 \uC124\uC815", description: "Portal configuration", icon: "sap-icon://settings", applicationType: "CUSTOM_HANDLER", target: "portal-admin", navigationMode: "TAB", roles: ["PORTAL_ADMIN"], parameters: {}, active: true }
  ],
  favorites: [{ userId: "jane.doe", applicationId: "ui5-sample" }],
  recent: []
};
const clone = value => JSON.parse(JSON.stringify(value));
let configuration = clone(seed);
const destinations = {
  "ui5-sample": { target: "com.acme.portal.framework.samples.ui5" },
  "iframe-sample": { target: "iframe-sample.html" },
  "external-sample": { target: "https://www.sap.com" },
  "portal-admin": { target: "portal-admin" }
};
const requireAdmin = (request, response, next) => request.get("x-portal-role") === "PORTAL_ADMIN" ? next() : response.status(403).json({ message: "PORTAL_ADMIN role is required." });

app.get("/api/portal/config", (_request, response) => response.json(clone(configuration)));
app.put("/api/portal/config", requireAdmin, (request, response) => {
  const { menus, applications } = request.body ?? {};
  if (!Array.isArray(menus) || !Array.isArray(applications)) return response.status(400).json({ message: "menus and applications arrays are required." });
  const ids = value => new Set(value.map(item => item.id)).size === value.length;
  if (!ids(menus) || !ids(applications)) return response.status(400).json({ message: "Duplicate menu or application ID." });
  configuration = { ...configuration, menus: clone(menus), applications: clone(applications) };
  return response.json(clone(configuration));
});
app.get("/api/session", (_request, response) => response.json(clone(seed.users[0])));
app.get("/api/destinations/:name", (request, response) => {
  const destination = destinations[request.params.name];
  return destination ? response.json(destination) : response.status(404).json({ message: "Destination not found." });
});
app.get("/api/portal/users/:userId/personalization", (request, response) => {
  const { userId } = request.params;
  const favorites = configuration.favorites.filter(item => item.userId === userId).map(item => item.applicationId);
  const recent = configuration.recent.filter(item => item.userId === userId).sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()).map(item => item.applicationId);
  response.json({ userId, favorites, recent });
});
app.put("/api/portal/users/:userId/personalization", (request, response) => {
  const { userId } = request.params;
  const { favorites, recent } = request.body ?? {};
  if (!Array.isArray(favorites) || !Array.isArray(recent)) return response.status(400).json({ message: "favorites and recent arrays are required." });
  const unique = values => [...new Set(values.filter(value => typeof value === "string"))];
  const savedFavorites = unique(favorites);
  const savedRecent = unique(recent).slice(0, 5);
  configuration.favorites = configuration.favorites.filter(item => item.userId !== userId).concat(savedFavorites.map(applicationId => ({ userId, applicationId })));
  configuration.recent = configuration.recent.filter(item => item.userId !== userId).concat(savedRecent.map((applicationId, index) => ({ userId, applicationId, executedAt: new Date(Date.now() - index).toISOString() })));
  response.json({ userId, favorites: savedFavorites, recent: savedRecent });
});
app.get("/api/health", (_request, response) => response.json({ status: "UP" }));

app.use(express.static(path.join(__dirname, "dist"), { index: "index.html" }));
if (require.main === module) app.listen(port, () => console.log(`Enterprise Portal PoC: http://localhost:${port}/index.html`));
module.exports = app;
