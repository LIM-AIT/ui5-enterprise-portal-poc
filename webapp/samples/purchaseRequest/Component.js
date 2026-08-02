sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/core/Icon",
  "sap/ui/core/EventBus",
  "sap/ui/model/json/JSONModel",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/Title",
  "sap/m/Text",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/Button",
  "sap/m/Table",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/ObjectIdentifier",
  "sap/m/ObjectNumber",
  "sap/m/ObjectStatus",
  "sap/m/MessageStrip",
  "sap/m/Toolbar",
  "sap/m/ToolbarSpacer",
  "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (
  UIComponent, Icon, EventBus, JSONModel, VBox, HBox, Title, Text, Label, Input, Button,
  Table, Column, ColumnListItem, ObjectIdentifier, ObjectNumber, ObjectStatus,
  MessageStrip, Toolbar, ToolbarSpacer, workflow
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
      messageId: "purchase-context-" + Date.now() + "-" + Math.random(),
      source: "purchase-request-app", target: "portal", eventType: "AI_CONTEXT_CHANGED",
      payload: Object.assign({ applicationId: "purchase-request-app", kind: "PURCHASE_REQUEST" }, payload),
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

  return UIComponent.extend("com.acme.portal.framework.samples.purchaseRequest.Component", {
    metadata: { manifest: "json" },

    createContent: function () {
      var model = new JSONModel({});
      var titleInput = new Input({
        width: "100%",
        placeholder: "예: 발전소 제어반 부품 구매",
        valueStateText: "요청 제목을 입력하세요."
      });
      var amountInput = new Input({
        width: "100%",
        type: "Number",
        placeholder: "0",
        valueStateText: "예상 금액을 입력하세요."
      });
      var notice = new MessageStrip({
        text: "등록된 요청은 FI 예산검토 후 결재 승인함으로 자동 전달됩니다.",
        type: "Information",
        showIcon: true,
        showCloseButton: false
      }).addStyleClass("enterpriseInlineMessage");

      function publishDraft() {
        var titleValue = titleInput.getValue().trim();
        var amountValue = Number(amountInput.getValue() || 0);
        publishContext({
          title: titleValue || "신규 구매요청 작성",
          summary: "현재 입력 중인 구매요청 초안",
          fields: [
            { label: "요청 제목", value: titleValue || "미입력", state: titleValue ? "Success" : "Warning" },
            { label: "예상 금액", value: amountValue ? money(amountValue) : "미입력", state: amountValue ? "Success" : "Warning" },
            { label: "다음 단계", value: "FI 예산검토" }
          ],
          data: { title: titleValue, amount: amountValue }
        });
      }
      titleInput.attachLiveChange(publishDraft);
      amountInput.attachLiveChange(publishDraft);

      function sync(requests) {
        var rows = decorate(requests);
        var pending = rows.filter(function (request) { return request.status === "REQUESTED"; });
        var total = rows.reduce(function (sum, request) { return sum + Number(request.amount || 0); }, 0);
        model.setData({
          requests: rows,
          requestCountText: rows.length + "건",
          pendingCountText: pending.length + "건",
          totalAmountText: compactMoney(total)
        });
        publishContext({
          title: "구매요청 등록",
          summary: "구매요청 현황과 신규 요청 작성",
          fields: [
            { label: "전체 요청", value: rows.length + "건" },
            { label: "예산 검토 대기", value: pending.length + "건", state: pending.length ? "Warning" : "Success" },
            { label: "누적 요청 금액", value: money(total) }
          ],
          data: { requests: rows }
        });
      }

      sync(workflow.getRequests());
      workflow.subscribe(sync);

      var requestTable = new Table({
        fixedLayout: false,
        noDataText: "등록된 구매요청이 없습니다.",
        columns: [
          new Column({ width: "9.5rem", header: new Text({ text: "요청번호" }) }),
          new Column({ header: new Text({ text: "요청 내용" }) }),
          new Column({ width: "9rem", hAlign: "End", header: new Text({ text: "예상 금액" }) }),
          new Column({ width: "7.5rem", header: new Text({ text: "진행 상태" }) })
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
      }).addStyleClass("enterpriseTable");
      requestTable.setModel(model);

      var submit = new Button({
        text: "구매요청 등록",
        icon: "sap-icon://paper-plane",
        type: "Emphasized",
        press: function () {
          var titleValue = titleInput.getValue().trim();
          var amountValue = amountInput.getValue();
          titleInput.setValueState(titleValue ? "None" : "Error");
          amountInput.setValueState(amountValue ? "None" : "Error");
          if (!titleValue || !amountValue) {
            notice.setText("요청 제목과 예상 금액을 확인해 주세요.");
            notice.setType("Warning");
            return;
          }
          var request = workflow.create(titleValue, amountValue);
          titleInput.setValue("");
          amountInput.setValue("");
          titleInput.setValueState("None");
          amountInput.setValueState("None");
          notice.setText(request.id + " 구매요청이 등록되었습니다. FI 예산검토를 기다립니다.");
          notice.setType("Success");
        }
      });

      var header = new HBox({
        width: "100%",
        justifyContent: "SpaceBetween",
        alignItems: "Center",
        items: [
          new VBox({
            items: [
              new Text({ text: "PROCUREMENT OPERATIONS" }).addStyleClass("enterpriseEyebrow"),
              new Title({ text: "구매요청 등록", level: "H2" }),
              new Text({ text: "구매 목적과 예상 금액을 입력하고 예산·결재 프로세스를 시작합니다." }).addStyleClass("enterpriseSubtitle")
            ]
          }),
          new ObjectStatus({ text: "신규 요청 작성", state: "Information", icon: "sap-icon://edit" }).addStyleClass("enterpriseHeaderStatus")
        ]
      }).addStyleClass("enterpriseAppHeader");

      var metrics = new HBox({
        width: "100%",
        items: [
          kpiCard("sap-icon://documents", "전체 요청", "{/requestCountText}", "enterpriseKpiBlue"),
          kpiCard("sap-icon://pending", "예산 검토 대기", "{/pendingCountText}", "enterpriseKpiAmber"),
          kpiCard("sap-icon://money-bills", "누적 요청 금액", "{/totalAmountText}", "enterpriseKpiGreen")
        ]
      }).addStyleClass("enterpriseKpiRow");
      metrics.setModel(model);

      var formCard = new VBox({
        width: "35%",
        items: [
          new Title({ text: "요청 정보", level: "H4" }),
          new Text({ text: "필수 항목을 입력해 새 구매요청을 생성합니다." }).addStyleClass("enterpriseSectionHint"),
          new Label({ text: "요청 제목", required: true, labelFor: titleInput }),
          titleInput,
          new Label({ text: "예상 금액 (원)", required: true, labelFor: amountInput }),
          amountInput,
          new HBox({ width: "100%", justifyContent: "End", items: [submit] }).addStyleClass("enterpriseFormActions"),
          notice
        ]
      }).addStyleClass("enterpriseCard enterpriseFormCard");

      var listCard = new VBox({
        width: "63%",
        items: [
          new Toolbar({
            content: [
              new Title({ text: "최근 구매요청", level: "H4" }),
              new ToolbarSpacer(),
              new ObjectStatus({ text: "실시간 Workflow", state: "Success", icon: "sap-icon://connected" })
            ]
          }).addStyleClass("enterpriseSectionToolbar"),
          requestTable
        ]
      }).addStyleClass("enterpriseCard enterpriseTableCard");

      return new VBox({
        width: "100%",
        items: [
          header,
          metrics,
          new HBox({ width: "100%", alignItems: "Stretch", justifyContent: "SpaceBetween", items: [formCard, listCard] }).addStyleClass("enterpriseMainRow")
        ]
      }).addStyleClass("enterpriseAppPage");
    }
  });
});
