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
  "sap/m/SearchField",
  "com/acme/portal/framework/core/MockPurchaseWorkflow"
], function (
  UIComponent, Icon, EventBus, JSONModel, VBox, HBox, Title, Text, Table, Column,
  ColumnListItem, ObjectIdentifier, ObjectNumber, ObjectStatus, Button,
  MessageToast, Toolbar, ToolbarSpacer, SearchField, workflow
) {
  "use strict";

  var statusMeta = {
    REQUESTED: { text: "예산 검토 대기", state: "Warning", icon: "sap-icon://pending" },
    BUDGET_APPROVED: { text: "결재 대기", state: "Information", icon: "sap-icon://inspection" },
    APPROVED: { text: "승인 완료", state: "Success", icon: "sap-icon://complete" },
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
      messageId: "approval-context-" + Date.now() + "-" + Math.random(),
      source: "approval-worklist-app", target: "portal", eventType: "AI_CONTEXT_CHANGED",
      payload: Object.assign({ applicationId: "approval-worklist-app", kind: "APPROVAL_WORKLIST" }, payload),
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

  return UIComponent.extend("com.acme.portal.framework.samples.approvalWorklist.Component", {
    metadata: { manifest: "json" },

    createContent: function () {
      var model = new JSONModel({});
      var allRequests = [];
      var selectedId = null;
      var currentPage = 1;
      var pageSize = 3;
      var searchTerm = "";

      function setSelectedRequest(request) {
        var canDecide = Boolean(request && request.status === "BUDGET_APPROVED");
        model.setProperty("/hasSelection", Boolean(request));
        model.setProperty("/canDecide", canDecide);
        model.setProperty("/selected", request || {
          id: "선택된 요청 없음",
          title: "결재 대상을 선택하세요",
          requester: "-",
          createdAt: "-",
          amountDisplay: "₩ 0",
          statusText: "선택 대기",
          statusState: "None",
          statusIcon: "sap-icon://circle-task"
        });
        model.setProperty("/decisionHint", !request
          ? "목록에서 결재 대상을 선택하세요."
          : canDecide
            ? "승인 또는 반려를 선택하세요."
            : "현재 상태에서는 결재할 수 없습니다.");
        publishContext(request ? {
          title: request.title,
          entityId: request.id,
          summary: "선택된 구매요청 결재 검토",
          fields: [
            { label: "요청 금액", value: request.amountDisplay },
            { label: "요청자", value: request.requester },
            { label: "요청일", value: request.createdAt },
            { label: "결재 상태", value: request.statusText, state: request.statusState }
          ],
          data: { selected: request, canDecide: canDecide }
        } : {
          title: "구매승인함",
          summary: "승인 대상 및 처리 이력",
          fields: [
            { label: "결재 대기", value: model.getProperty("/pendingCountText") || "0건", state: "Information" },
            { label: "대기 결재 금액", value: model.getProperty("/pendingAmountText") || "₩ 0" },
            { label: "승인 완료", value: model.getProperty("/approvedCountText") || "0건", state: "Success" },
            { label: "반려", value: model.getProperty("/rejectedCountText") || "0건", state: "Error" }
          ]
        });
      }

      function refreshSelection() {
        var selected = allRequests.filter(function (request) { return request.id === selectedId; })[0];
        setSelectedRequest(selected || null);
      }

      function applyPage() {
        var filtered = allRequests.filter(function (request) {
          var haystack = [request.id, request.title, request.requester, request.statusText].join(" ").toLowerCase();
          return !searchTerm || haystack.includes(searchTerm);
        });
        var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentPage = Math.min(Math.max(currentPage, 1), totalPages);
        var start = (currentPage - 1) * pageSize;
        var end = Math.min(start + pageSize, filtered.length);

        model.setProperty("/requests", filtered.slice(start, end));
        model.setProperty("/pageText", currentPage + " / " + totalPages);
        model.setProperty("/rangeText", filtered.length ? (start + 1) + "–" + end + " / " + filtered.length + "건" : "0건");
        model.setProperty("/hasPrevious", currentPage > 1);
        model.setProperty("/hasNext", currentPage < totalPages);
        refreshSelection();
      }

      function sync(requests) {
        allRequests = decorate(requests);
        var pending = allRequests.filter(function (request) { return request.status === "BUDGET_APPROVED"; });
        var pendingAmount = pending.reduce(function (sum, request) { return sum + Number(request.amount || 0); }, 0);

        model.setProperty("/pendingCountText", pending.length + "건");
        model.setProperty("/pendingHeaderText", "결재 대기 " + pending.length + "건");
        model.setProperty("/pendingAmountText", compactMoney(pendingAmount));
        model.setProperty("/approvedCountText", allRequests.filter(function (request) { return request.status === "APPROVED"; }).length + "건");
        model.setProperty("/rejectedCountText", allRequests.filter(function (request) { return request.status === "REJECTED"; }).length + "건");
        applyPage();
      }

      sync(workflow.getRequests());
      workflow.subscribe(sync);

      var table = new Table({
        mode: "SingleSelectMaster",
        includeItemInSelection: true,
        fixedLayout: false,
        noDataText: "검색 조건에 맞는 구매요청이 없습니다.",
        selectionChange: function (event) {
          var item = event.getParameter("listItem");
          var request = item && item.getBindingContext().getObject();
          selectedId = request && request.id;
          setSelectedRequest(request || null);
        },
        columns: [
          new Column({ width: "9.5rem", header: new Text({ text: "요청번호" }) }),
          new Column({ header: new Text({ text: "구매요청" }) }),
          new Column({ width: "8.5rem", hAlign: "End", header: new Text({ text: "요청 금액" }) }),
          new Column({ width: "8.2rem", header: new Text({ text: "결재 상태" }) })
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
      }).addStyleClass("enterpriseTable enterpriseApprovalTable");

      var search = new SearchField({
        width: "12.5rem",
        placeholder: "요청번호 또는 제목 검색",
        liveChange: function (event) {
          searchTerm = String(event.getParameter("newValue") || "").toLowerCase();
          currentPage = 1;
          selectedId = null;
          table.removeSelections(true);
          applyPage();
        }
      });

      function movePage(offset) {
        currentPage += offset;
        selectedId = null;
        table.removeSelections(true);
        applyPage();
      }

      function selectedForDecision() {
        return allRequests.filter(function (request) { return request.id === selectedId; })[0];
      }

      function decide(action) {
        var request = selectedForDecision();
        if (!request || request.status !== "BUDGET_APPROVED") {
          MessageToast.show("예산 검토가 완료된 결재 대상을 선택해 주세요.");
          return;
        }
        if (action === "approve") {
          workflow.approve(request.id);
          MessageToast.show(request.id + " 구매요청을 승인했습니다.");
        } else {
          workflow.reject(request.id);
          MessageToast.show(request.id + " 구매요청을 반려했습니다.");
        }
      }

      var header = new HBox({
        width: "100%",
        justifyContent: "SpaceBetween",
        alignItems: "Center",
        items: [
          new VBox({
            items: [
              new Text({ text: "APPROVAL CENTER" }).addStyleClass("enterpriseEyebrow"),
              new Title({ text: "구매승인함", level: "H2" }),
              new Text({ text: "예산 검토가 완료된 구매요청을 검토하고 최종 승인 또는 반려합니다." }).addStyleClass("enterpriseSubtitle")
            ]
          }),
          new ObjectStatus({ text: "{/pendingHeaderText}", state: "Information", icon: "sap-icon://inspection" }).addStyleClass("enterpriseHeaderStatus")
        ]
      }).addStyleClass("enterpriseAppHeader");

      var metrics = new HBox({
        width: "100%",
        items: [
          kpiCard("sap-icon://inspection", "결재 대기", "{/pendingCountText}", "enterpriseKpiBlue"),
          kpiCard("sap-icon://money-bills", "대기 결재 금액", "{/pendingAmountText}", "enterpriseKpiAmber"),
          kpiCard("sap-icon://complete", "승인 완료", "{/approvedCountText}", "enterpriseKpiGreen"),
          kpiCard("sap-icon://decline", "반려", "{/rejectedCountText}", "enterpriseKpiViolet")
        ]
      }).addStyleClass("enterpriseKpiRow enterpriseKpiRowFour");

      var queueCard = new VBox({
        width: "69%",
        items: [
          new Toolbar({
            content: [
              new Title({ text: "승인 대상 및 처리 이력", level: "H4" }),
              new ToolbarSpacer(),
              search
            ]
          }).addStyleClass("enterpriseSectionToolbar"),
          table,
          new Toolbar({
            content: [
              new Text({ text: "{/rangeText}" }).addStyleClass("enterprisePageRange"),
              new ToolbarSpacer(),
              new Button({ icon: "sap-icon://navigation-left-arrow", type: "Transparent", tooltip: "이전 페이지", enabled: "{/hasPrevious}", press: function () { movePage(-1); } }),
              new Text({ text: "{/pageText}" }).addStyleClass("enterprisePageNumber"),
              new Button({ icon: "sap-icon://navigation-right-arrow", type: "Transparent", tooltip: "다음 페이지", enabled: "{/hasNext}", press: function () { movePage(1); } })
            ]
          }).addStyleClass("enterprisePaginationBar")
        ]
      }).addStyleClass("enterpriseCard enterprisePagedCard");

      var decisionCard = new VBox({
        width: "29%",
        items: [
          new HBox({
            justifyContent: "SpaceBetween",
            alignItems: "Center",
            items: [
              new Title({ text: "결재 상세", level: "H4" }),
              new ObjectStatus({ text: "{/selected/statusText}", state: "{/selected/statusState}", icon: "{/selected/statusIcon}" })
            ]
          }),
          new Text({ text: "구매요청" }).addStyleClass("enterpriseDecisionLabel"),
          new ObjectIdentifier({ title: "{/selected/title}", text: "{/selected/id}" }).addStyleClass("enterpriseDecisionIdentifier"),
          new HBox({
            justifyContent: "SpaceBetween",
            alignItems: "End",
            items: [
              new Text({ text: "요청 금액" }).addStyleClass("enterpriseDecisionLabel"),
              new Title({ text: "{/selected/amountDisplay}", level: "H4" }).addStyleClass("enterpriseDecisionAmount")
            ]
          }).addStyleClass("enterpriseDecisionAmountRow"),
          new HBox({ justifyContent: "SpaceBetween", items: [new Text({ text: "요청자" }), new Text({ text: "{/selected/requester}" })] }).addStyleClass("enterpriseDecisionMeta"),
          new HBox({ justifyContent: "SpaceBetween", items: [new Text({ text: "요청일" }), new Text({ text: "{/selected/createdAt}" })] }).addStyleClass("enterpriseDecisionMeta"),
          new HBox({
            alignItems: "Center",
            items: [
              new Icon({ src: "sap-icon://hint" }).addStyleClass("enterprisePolicyHintIcon"),
              new Text({ text: "{/decisionHint}" })
            ]
          }).addStyleClass("enterpriseDecisionHint"),
          new HBox({
            width: "100%",
            items: [
              new Button({ text: "반려", icon: "sap-icon://decline", type: "Reject", width: "49%", enabled: "{/canDecide}", press: function () { decide("reject"); } }),
              new Button({ text: "승인", icon: "sap-icon://accept", type: "Emphasized", width: "49%", enabled: "{/canDecide}", press: function () { decide("approve"); } })
            ]
          }).addStyleClass("enterpriseDecisionActions")
        ]
      }).addStyleClass("enterpriseCard enterpriseDecisionCard");

      var page = new VBox({
        width: "100%",
        items: [
          header,
          metrics,
          new HBox({ width: "100%", alignItems: "Stretch", justifyContent: "SpaceBetween", items: [queueCard, decisionCard] }).addStyleClass("enterpriseMainRow")
        ]
      }).addStyleClass("enterpriseAppPage");
      page.setModel(model);
      return page;
    }
  });
});
