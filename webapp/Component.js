sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "./core/PortalController"
], function (UIComponent, JSONModel, PortalController) {
  "use strict";

  return UIComponent.extend("com.acme.portal.framework.Component", {
    metadata: { manifest: "json" },
    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.portal = new PortalController();
      this.setModel(new JSONModel(this.portal.getViewState()), "portal");
      this.setModel(new JSONModel(this.portal.getAdminState()), "admin");
      this.portal.loadConfiguration().then(function () {
        this.getModel("portal").setData(this.portal.getViewState());
        this.getModel("admin").setData(this.portal.getAdminState());
      }.bind(this)).catch(function () {
        // The in-memory controller data remains available when the API is not reachable.
      });
      this.portal.loadIdentity().catch(function () {
        // Local fallback user remains active when an identity provider is not configured.
      });
    }
  });
});
