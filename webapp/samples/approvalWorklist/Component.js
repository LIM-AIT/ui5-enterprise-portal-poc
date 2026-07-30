sap.ui.define([
  "sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "sap/m/VBox", "sap/m/HBox", "sap/m/Title", "sap/m/List", "sap/m/StandardListItem", "sap/m/Button", "sap/m/MessageStrip", "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (UIComponent, JSONModel, VBox, HBox, Title, List, StandardListItem, Button, MessageStrip, workflow) {
  "use strict";
  return UIComponent.extend("com.acme.portal.framework.samples.approvalWorklist.Component", {
    metadata: { manifest: "json" },
    createContent: function () {
      var model = new JSONModel({ requests: workflow.getRequests() });
      var notice = new MessageStrip({ text: "BUDGET_APPROVED 상태의 구매요청을 승인하거나 반려할 수 있습니다.", type: "Information", showIcon: true });
      var list = new List({ mode: "SingleSelectMaster", headerText: "결재 대기", items: { path: "/requests", template: new StandardListItem({ title: "{id} · {title}", description: "{amount}원 · 요청자: {requester}", info: "{status}" }) } });
      list.setModel(model); workflow.subscribe(function (requests) { model.setProperty("/requests", requests); });
      function selected() { var item = list.getSelectedItem(); return item && item.getBindingContext().getObject(); }
      function validate() { var request = selected(); if (!request) { notice.setText("승인 또는 반려할 구매요청을 선택하세요."); notice.setType("Warning"); return null; } if (request.status === "APPROVED") { notice.setText(request.id + "은 이미 최종 승인된 건입니다."); notice.setType("Information"); return null; } if (request.status === "REJECTED") { notice.setText(request.id + "은 이미 반려된 건입니다."); notice.setType("Information"); return null; } if (request.status === "REQUESTED") { notice.setText(request.id + "은 FI 예산 검토가 완료되지 않았습니다."); notice.setType("Warning"); return null; } if (request.status !== "BUDGET_APPROVED") { notice.setText("승인 가능한 상태가 아닙니다."); notice.setType("Warning"); return null; } return request; }
      return new VBox({ width: "100%", items: [notice, new Title({ text: "구매요청 결재", level: "H3" }), list, new HBox({ items: [new Button({ text: "승인", type: "Accept", press: function () { var request = validate(); if (request) { workflow.approve(request.id); notice.setText(request.id + " 구매요청을 승인했습니다."); notice.setType("Success"); } } }), new Button({ text: "반려", type: "Reject", press: function () { var request = validate(); if (request) { workflow.reject(request.id); notice.setText(request.id + " 구매요청을 반려했습니다."); notice.setType("Error"); } } })] })] });
    }
  });
});
