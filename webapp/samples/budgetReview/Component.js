sap.ui.define([
  "sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "sap/m/VBox", "sap/m/HBox", "sap/m/Title", "sap/m/List", "sap/m/StandardListItem", "sap/m/Button", "sap/m/MessageStrip", "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (UIComponent, JSONModel, VBox, HBox, Title, List, StandardListItem, Button, MessageStrip, workflow) {
  "use strict";
  return UIComponent.extend("com.acme.portal.framework.samples.budgetReview.Component", {
    metadata: { manifest: "json" },
    createContent: function () {
      var model = new JSONModel({ requests: workflow.getRequests() });
      var notice = new MessageStrip({ text: "REQUESTED 상태의 구매요청을 선택하여 예산 검토를 완료하세요.", type: "Information", showIcon: true });
      var list = new List({ mode: "SingleSelectMaster", headerText: "예산 검토 대기", items: { path: "/requests", template: new StandardListItem({ title: "{id} · {title}", description: "{amount}원 · 요청자: {requester}", info: "{status}" }) } });
      list.setModel(model); workflow.subscribe(function (requests) { model.setProperty("/requests", requests); });
      return new VBox({ width: "100%", items: [notice, new Title({ text: "FI 예산검토", level: "H3" }), list, new HBox({ items: [new Button({ text: "예산 검토 완료", type: "Emphasized", press: function () { var selected = list.getSelectedItem(); var request = selected && selected.getBindingContext().getObject(); if (!request) { notice.setText("검토할 구매요청을 선택하세요."); notice.setType("Warning"); return; } if (request.status === "BUDGET_APPROVED") { notice.setText(request.id + "은 이미 예산 검토가 완료되었습니다."); notice.setType("Information"); return; } if (request.status === "APPROVED") { notice.setText(request.id + "은 최종 승인까지 완료된 건입니다."); notice.setType("Information"); return; } if (request.status === "REJECTED") { notice.setText(request.id + "은 반려된 건이므로 예산 검토할 수 없습니다."); notice.setType("Error"); return; } workflow.reviewBudget(request.id); notice.setText(request.id + " 예산 검토가 완료되어 결재자에게 전달되었습니다."); notice.setType("Success"); } })] })] });
    }
  });
});
