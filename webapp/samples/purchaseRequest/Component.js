sap.ui.define([
  "sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "sap/m/VBox", "sap/m/HBox", "sap/m/Title", "sap/m/Label", "sap/m/Input", "sap/m/Button", "sap/m/List", "sap/m/StandardListItem", "sap/m/MessageStrip", "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (UIComponent, JSONModel, VBox, HBox, Title, Label, Input, Button, List, StandardListItem, MessageStrip, workflow) {
  "use strict";
  return UIComponent.extend("com.acme.portal.framework.samples.purchaseRequest.Component", {
    metadata: { manifest: "json" },
    createContent: function () {
      var model = new JSONModel({ requests: workflow.getRequests() });
      var title = new Input({ width: "18rem", placeholder: "예: 발전소 제어반 부품 구매" });
      var amount = new Input({ width: "10rem", type: "Number", placeholder: "금액" });
      var notice = new MessageStrip({ text: "구매요청을 등록하면 FI 예산검토와 결재 승인함으로 전달됩니다.", type: "Information", showIcon: true });
      var list = new List({ headerText: "내 구매요청", items: { path: "/requests", template: new StandardListItem({ title: "{id} · {title}", description: "{amount}원 · {status}", info: "{status}" }) } });
      list.setModel(model);
      workflow.subscribe(function (requests) { model.setProperty("/requests", requests); });
      return new VBox({ width: "100%", items: [notice, new Title({ text: "구매요청 등록", level: "H3" }), new HBox({ items: [new VBox({ items: [new Label({ text: "요청 제목" }), title] }), new VBox({ items: [new Label({ text: "예상 금액 (원)" }), amount] }), new Button({ text: "요청 등록", type: "Emphasized", press: function () { if (!title.getValue() || !amount.getValue()) { notice.setText("요청 제목과 금액을 입력하세요."); notice.setType("Warning"); return; } var request = workflow.create(title.getValue(), amount.getValue()); title.setValue(""); amount.setValue(""); notice.setText(request.id + " 구매요청이 등록되었습니다. FI 예산검토를 기다립니다."); notice.setType("Success"); } })] }), list] });
    }
  });
});
