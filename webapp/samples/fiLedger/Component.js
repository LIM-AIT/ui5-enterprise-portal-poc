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
  "sap/m/Toolbar",
  "sap/m/ToolbarSpacer",
  "sap/m/SearchField",
  "sap/m/ProgressIndicator"
], function (
  UIComponent, Icon, EventBus, JSONModel, VBox, HBox, Title, Text, Table, Column,
  ColumnListItem, ObjectIdentifier, ObjectNumber, ObjectStatus, Toolbar,
  ToolbarSpacer, SearchField, ProgressIndicator
) {
  "use strict";

  function money(value) {
    return "₩ " + Number(value || 0).toLocaleString("ko-KR");
  }

  function publishContext(payload) {
    EventBus.getInstance().publish("portal", "AI_CONTEXT_CHANGED", {
      messageId: "ledger-context-" + Date.now() + "-" + Math.random(),
      source: "fi-ledger-app", target: "portal", eventType: "AI_CONTEXT_CHANGED",
      payload: Object.assign({ applicationId: "fi-ledger-app", kind: "FI_LEDGER" }, payload),
      timestamp: new Date().toISOString()
    });
  }

  function publishSummary(items) {
    var amount = items.reduce(function (sum, item) { return sum + Number(item.amount || 0); }, 0);
    publishContext({
      title: "FI 전표 · 예산 현황",
      summary: "회사코드 1000 · 2026 회계연도",
      fields: [
        { label: "조회 전표", value: items.length + "건" },
        { label: "조회 금액", value: money(amount) },
        { label: "월 예산 사용률", value: "68%", state: "Information" },
        { label: "가용 예산", value: "₩ 6,900,000", state: "Success" }
      ],
      data: { documents: items }
    });
  }

  function kpiCard(icon, label, value, toneClass, footer) {
    var items = [
      new HBox({
        alignItems: "Center",
        items: [
          new Icon({ src: icon }).addStyleClass("enterpriseKpiIcon"),
          new VBox({
            items: [
              new Text({ text: label }).addStyleClass("enterpriseKpiLabel"),
              new Title({ text: value, level: "H4" }).addStyleClass("enterpriseKpiValue")
            ]
          })
        ]
      })
    ];
    if (footer) items.push(footer);
    return new VBox({ items: items }).addStyleClass("enterpriseKpiCard " + toneClass);
  }

  return UIComponent.extend("com.acme.portal.framework.samples.fiLedger.Component", {
    metadata: { manifest: "json" },

    createContent: function () {
      var source = [
        { doc: "1900004821", date: "2026-07-31", company: "1000", title: "현장 안전장비 구매", category: "소모품비", amount: 2400000, statusText: "예산 검토 완료", statusState: "Success", statusIcon: "sap-icon://accept" },
        { doc: "1900004822", date: "2026-08-01", company: "1000", title: "설비 예방정비 용역", category: "수선유지비", amount: 4800000, statusText: "전표 처리 대기", statusState: "Warning", statusIcon: "sap-icon://pending" },
        { doc: "1900004823", date: "2026-08-01", company: "1000", title: "제어반 예비부품 구매", category: "저장품", amount: 3250000, statusText: "승인 완료", statusState: "Success", statusIcon: "sap-icon://complete" },
        { doc: "1900004824", date: "2026-08-02", company: "1000", title: "안전진단 컨설팅", category: "지급수수료", amount: 4200000, statusText: "검토 필요", statusState: "Information", statusIcon: "sap-icon://inspection" }
      ].map(function (item) { return Object.assign({}, item, { amountDisplay: money(item.amount) }); });
      var model = new JSONModel({ items: source });
      publishSummary(source);

      var table = new Table({
        mode: "SingleSelectMaster",
        includeItemInSelection: true,
        fixedLayout: false,
        sticky: ["ColumnHeaders"],
        noDataText: "검색 조건에 맞는 전표가 없습니다.",
        selectionChange: function (event) {
          var item = event.getParameter("listItem");
          var document = item && item.getBindingContext().getObject();
          if (document) publishContext({
            title: document.title,
            entityId: document.doc,
            summary: "선택된 FI 전표 상세",
            fields: [
              { label: "전표 금액", value: document.amountDisplay },
              { label: "계정 분류", value: document.category },
              { label: "전기일", value: document.date },
              { label: "처리 상태", value: document.statusText, state: document.statusState }
            ],
            data: { selected: document }
          });
        },
        columns: [
          new Column({ width: "10rem", header: new Text({ text: "전표번호" }) }),
          new Column({ width: "6rem", header: new Text({ text: "회사코드" }) }),
          new Column({ header: new Text({ text: "전표 내역" }) }),
          new Column({ width: "9rem", hAlign: "End", header: new Text({ text: "금액" }) }),
          new Column({ width: "8.5rem", header: new Text({ text: "처리 상태" }) })
        ],
        items: {
          path: "/items",
          template: new ColumnListItem({
            vAlign: "Middle",
            cells: [
              new ObjectIdentifier({ title: "{doc}", text: "{date}" }),
              new ObjectStatus({ text: "{company}", state: "Information" }),
              new ObjectIdentifier({ title: "{title}", text: "{category}" }),
              new ObjectNumber({ number: "{amountDisplay}" }),
              new ObjectStatus({ text: "{statusText}", state: "{statusState}", icon: "{statusIcon}" })
            ]
          })
        }
      }).addStyleClass("enterpriseTable enterpriseLedgerTable");
      table.setModel(model);

      var search = new SearchField({
        width: "13rem",
        placeholder: "전표번호 또는 내역 검색",
        liveChange: function (event) {
          var term = String(event.getParameter("newValue") || "").toLowerCase();
          var filtered = source.filter(function (item) {
            return !term || item.doc.toLowerCase().includes(term) || item.title.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
          });
          model.setProperty("/items", filtered);
          publishSummary(filtered);
        }
      });

      var header = new HBox({
        width: "100%",
        justifyContent: "SpaceBetween",
        alignItems: "Center",
        items: [
          new VBox({
            items: [
              new Text({ text: "FINANCE OPERATIONS" }).addStyleClass("enterpriseEyebrow"),
              new Title({ text: "FI 전표 · 예산 현황", level: "H2" }),
              new Text({ text: "회사코드 1000의 주요 전표와 예산 집행 상태를 통합 조회합니다." }).addStyleClass("enterpriseSubtitle")
            ]
          }),
          new ObjectStatus({ text: "S/4HANA Mock 연결", state: "Information", icon: "sap-icon://database" }).addStyleClass("enterpriseHeaderStatus")
        ]
      }).addStyleClass("enterpriseAppHeader");

      var utilization = new ProgressIndicator({
        percentValue: 68,
        displayValue: "월 예산 사용률 68%",
        state: "Information",
        height: "0.5rem"
      }).addStyleClass("enterpriseKpiProgress");

      var metrics = new HBox({
        width: "100%",
        items: [
          kpiCard("sap-icon://document-text", "조회 전표", "4건", "enterpriseKpiBlue"),
          kpiCard("sap-icon://money-bills", "집행 금액", "₩ 14.7M", "enterpriseKpiGreen"),
          kpiCard("sap-icon://pending", "처리 대기", "2건", "enterpriseKpiAmber"),
          kpiCard("sap-icon://business-objects-experience", "예산 소진율", "68%", "enterpriseKpiViolet", utilization)
        ]
      }).addStyleClass("enterpriseKpiRow enterpriseKpiRowFour");

      var tableCard = new VBox({
        width: "100%",
        items: [
          new Toolbar({
            content: [
              new Title({ text: "전표 처리 현황", level: "H4" }),
              new ObjectStatus({ text: "2026 회계연도", state: "None" }).addStyleClass("enterpriseToolbarMeta"),
              new ToolbarSpacer(),
              search,
              new ObjectStatus({ text: "최종 동기화 13:42", state: "Success", icon: "sap-icon://synchronize" })
            ]
          }).addStyleClass("enterpriseSectionToolbar"),
          table
        ]
      }).addStyleClass("enterpriseCard enterpriseTableCard enterpriseLedgerCard");

      return new VBox({ width: "100%", items: [header, metrics, tableCard] }).addStyleClass("enterpriseAppPage");
    }
  });
});
