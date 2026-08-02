sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/core/Icon",
  "sap/ui/core/EventBus",
  "sap/ui/model/json/JSONModel",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/Title",
  "sap/m/Text",
  "sap/m/Table",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/ObjectIdentifier",
  "sap/m/ObjectNumber",
  "sap/m/ObjectStatus",
  "sap/m/Button",
  "sap/m/MessageToast",
  "sap/m/Toolbar",
  "sap/m/ToolbarSpacer",
  "sap/m/ProgressIndicator",
  "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (
  UIComponent, Icon, EventBus, JSONModel, VBox, HBox, Title, Text, Table, Column,
  ColumnListItem, ObjectIdentifier, ObjectNumber, ObjectStatus, Button,
  MessageToast, Toolbar, ToolbarSpacer, ProgressIndicator, workflow
) {
  "use strict";

  var statusMeta = {
    REQUESTED: { text: "검토 대기", state: "Warning", icon: "sap-icon://pending" },
    BUDGET_APPROVED: { text: "예산 승인", state: "Success", icon: "sap-icon://accept" },
    APPROVED: { text: "최종 승인", state: "Success", icon: "sap-icon://complete" },
    REJECTED: { text: "반려", state: "Error", icon: "sap-icon://decline" }
  };

  function money(value) {
    return "₩ " + Number(value || 0).toLocaleString("ko-KR");
  }

  function compactMoney(value) {
    return "₩ " + (Number(value || 0) / 1000000).toFixed(1) + "M";
  }

  function publishContext(payload) {
    EventBus.getInstance().publish("portal", "AI_CONTEXT_CHANGED", {
      messageId: "budget-context-" + Date.now() + "-" + Math.random(),
      source: "budget-review-app", target: "portal", eventType: "AI_CONTEXT_CHANGED",
      payload: Object.assign({ applicationId: "budget-review-app", kind: "BUDGET_REVIEW" }, payload),
      timestamp: new Date().toISOString()
    });
  }

  function decorate(requests) {
    return requests.map(function (request) {
      var meta = statusMeta[request.status] || { text: request.status, state: "None", icon: "sap-icon://circle-task" };
      return Object.assign({}, request, {
        amountDisplay: money(request.amount),
        statusText: meta.text,
        statusState: meta.state,
        statusIcon: meta.icon
      });
    });
  }

  function kpiCard(icon, label, valuePath, toneClass) {
    return new HBox({
      alignItems: "Center",
      items: [
        new Icon({ src: icon }).addStyleClass("enterpriseKpiIcon"),
        new VBox({
          items: [
            new Text({ text: label }).addStyleClass("enterpriseKpiLabel"),
            new Title({ text: valuePath, level: "H4" }).addStyleClass("enterpriseKpiValue")
          ]
        })
      ]
    }).addStyleClass("enterpriseKpiCard " + toneClass);
  }

  return UIComponent.extend("com.acme.portal.framework.samples.budgetReview.Component", {
    metadata: { manifest: "json" },

    createContent: function () {
      var model = new JSONModel({});
      function sync(requests) {
        var rows = decorate(requests);
        var pending = rows.filter(function (request) { return request.status === "REQUESTED"; });
        var pendingAmount = pending.reduce(function (sum, request) { return sum + Number(request.amount || 0); }, 0);
        model.setData({
          requests: rows,
          pendingCountText: pending.length + "건",
          pendingHeaderText: "검토 대기 " + pending.length + "건",
          pendingAmountText: compactMoney(pendingAmount),
          reviewedCountText: rows.filter(function (request) { return request.status !== "REQUESTED"; }).length + "건"
        });
        publishContext({
          title: "FI 예산검토",
          summary: "비용센터 1000-MRO · 월 구매예산",
          fields: [
            { label: "검토 대기", value: pending.length + "건", state: pending.length ? "Warning" : "Success" },
            { label: "대기 요청 금액", value: money(pendingAmount) },
            { label: "가용 예산", value: "₩ 12,600,000", state: "Success" },
            { label: "집행률", value: "32%" }
          ],
          data: { requests: rows, pending: pending }
        });
      }

      sync(workflow.getRequests());
      workflow.subscribe(sync);

      var reviewTable = new Table({
        mode: "SingleSelectMaster",
        includeItemInSelection: true,
        fixedLayout: false,
        noDataText: "예산 검토 대상 구매요청이 없습니다.",
        selectionChange: function (event) {
          var item = event.getParameter("listItem");
          var request = item && item.getBindingContext().getObject();
          if (request) publishContext({
            title: request.title,
            entityId: request.id,
            summary: "선택된 구매요청 예산 검토",
            fields: [
              { label: "요청 금액", value: request.amountDisplay },
              { label: "요청자", value: request.requester },
              { label: "검토 상태", value: request.statusText, state: request.statusState },
              { label: "가용 예산", value: "₩ 12,600,000", state: "Success" }
            ],
            data: { selected: request }
          });
        },
        columns: [
          new Column({ width: "9.5rem", header: new Text({ text: "요청번호" }) }),
          new Column({ header: new Text({ text: "구매요청" }) }),
          new Column({ width: "8.5rem", hAlign: "End", header: new Text({ text: "요청 금액" }) }),
          new Column({ width: "7.5rem", header: new Text({ text: "검토 상태" }) })
        ],
        items: {
          path: "/requests",
          template: new ColumnListItem({
            vAlign: "Middle",
            cells: [
              new ObjectIdentifier({ title: "{id}", text: "{createdAt}" }),
              new ObjectIdentifier({ title: "{title}", text: "요청자 · {requester}" }),
              new ObjectNumber({ number: "{amountDisplay}" }),
              new ObjectStatus({ text: "{statusText}", state: "{statusState}", icon: "{statusIcon}" })
            ]
          })
        }
      }).addStyleClass("enterpriseTable enterpriseReviewTable");
      reviewTable.setModel(model);

      var reviewButton = new Button({
        text: "예산 검토 완료",
        icon: "sap-icon://accept",
        type: "Emphasized",
        width: "100%",
        press: function () {
          var selected = reviewTable.getSelectedItem();
          var request = selected && selected.getBindingContext().getObject();
          if (!request) {
            MessageToast.show("검토할 구매요청을 먼저 선택해 주세요.");
            return;
          }
          if (request.status === "BUDGET_APPROVED") {
            MessageToast.show(request.id + "은 이미 예산 검토가 완료되었습니다.");
            return;
          }
          if (request.status === "APPROVED") {
            MessageToast.show(request.id + "은 최종 승인까지 완료된 건입니다.");
            return;
          }
          if (request.status === "REJECTED") {
            MessageToast.show(request.id + "은 반려된 건이므로 예산 검토할 수 없습니다.");
            return;
          }
          workflow.reviewBudget(request.id);
          MessageToast.show(request.id + " 예산 검토가 완료되어 결재자에게 전달되었습니다.");
        }
      });

      var header = new HBox({
        width: "100%",
        justifyContent: "SpaceBetween",
        alignItems: "Center",
        items: [
          new VBox({
            items: [
              new Text({ text: "FINANCE CONTROL" }).addStyleClass("enterpriseEyebrow"),
              new Title({ text: "FI 예산검토", level: "H2" }),
              new Text({ text: "구매요청의 예산 가용성과 집행 정책을 검토하고 결재 단계로 전달합니다." }).addStyleClass("enterpriseSubtitle")
            ]
          }),
          new ObjectStatus({ text: "{/pendingHeaderText}", state: "Warning", icon: "sap-icon://pending" }).addStyleClass("enterpriseHeaderStatus")
        ]
      }).addStyleClass("enterpriseAppHeader");
      header.setModel(model);

      var metrics = new HBox({
        width: "100%",
        items: [
          kpiCard("sap-icon://pending", "검토 대기", "{/pendingCountText}", "enterpriseKpiAmber"),
          kpiCard("sap-icon://money-bills", "대기 요청 금액", "{/pendingAmountText}", "enterpriseKpiBlue"),
          kpiCard("sap-icon://wallet", "가용 예산", "₩ 12.6M", "enterpriseKpiGreen"),
          kpiCard("sap-icon://complete", "처리 완료", "{/reviewedCountText}", "enterpriseKpiViolet")
        ]
      }).addStyleClass("enterpriseKpiRow enterpriseKpiRowFour");
      metrics.setModel(model);

      var queueCard = new VBox({
        width: "68%",
        items: [
          new Toolbar({
            content: [
              new Title({ text: "예산 검토 작업함", level: "H4" }),
              new ToolbarSpacer(),
              new ObjectStatus({ text: "비용센터 1000-MRO", state: "Information" })
            ]
          }).addStyleClass("enterpriseSectionToolbar"),
          reviewTable
        ]
      }).addStyleClass("enterpriseCard enterpriseTableCard");

      var policyCard = new VBox({
        width: "30%",
        items: [
          new HBox({
            justifyContent: "SpaceBetween",
            alignItems: "Center",
            items: [
              new Title({ text: "검토 기준", level: "H4" }),
              new ObjectStatus({ text: "정책 정상", state: "Success", icon: "sap-icon://shield" })
            ]
          }),
          new Text({ text: "월 구매예산" }).addStyleClass("enterprisePolicyLabel"),
          new HBox({
            justifyContent: "SpaceBetween",
            items: [
              new Title({ text: "₩ 18,500,000", level: "H5" }),
              new Text({ text: "잔액 ₩ 12,600,000" }).addStyleClass("enterprisePolicyValue")
            ]
          }),
          new ProgressIndicator({ percentValue: 32, displayValue: "집행률 32%", state: "Success", height: "1rem" }).addStyleClass("enterprisePolicyProgress"),
          new HBox({ justifyContent: "SpaceBetween", items: [new Text({ text: "단일 요청 한도" }), new ObjectStatus({ text: "₩ 5,000,000", state: "Success" })] }).addStyleClass("enterprisePolicyRow"),
          new HBox({ justifyContent: "SpaceBetween", items: [new Text({ text: "정책 위반" }), new ObjectStatus({ text: "0건", state: "Success" })] }).addStyleClass("enterprisePolicyRow"),
          new HBox({
            alignItems: "Center",
            items: [
              new Icon({ src: "sap-icon://hint" }).addStyleClass("enterprisePolicyHintIcon"),
              new Text({ text: "작업함에서 검토 대상을 선택하세요." })
            ]
          }).addStyleClass("enterprisePolicyHint"),
          reviewButton
        ]
      }).addStyleClass("enterpriseCard enterprisePolicyCard");

      return new VBox({
        width: "100%",
        items: [
          header,
          metrics,
          new HBox({ width: "100%", alignItems: "Stretch", justifyContent: "SpaceBetween", items: [queueCard, policyCard] }).addStyleClass("enterpriseMainRow")
        ]
      }).addStyleClass("enterpriseAppPage");
    }
  });
});
