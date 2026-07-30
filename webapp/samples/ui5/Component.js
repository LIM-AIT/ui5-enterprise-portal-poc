sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/core/EventBus",
  "sap/m/MessageStrip",
  "sap/m/VBox"
], function (UIComponent, EventBus, MessageStrip, VBox) {
  "use strict";

  return UIComponent.extend("com.acme.portal.framework.samples.ui5.Component", {
    metadata: { manifest: "json" },
    createContent: function () {
      var strip = new MessageStrip({
        text: "독립 SAPUI5 Component 샘플 앱이 Workspace 안에서 실행 중입니다.",
        type: "Success",
        showIcon: true
      });
      EventBus.getInstance().subscribe("portal", "PORTAL_TEST_MESSAGE", function (_, __, message) {
        if (message.target === "ui5-sample") {
          strip.setText("Portal 메시지 수신: " + message.eventType);
          strip.setType("Information");
        }
      });
      return new VBox({
        items: [strip]
      });
    }
  });
});
