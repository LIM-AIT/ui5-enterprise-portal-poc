sap.ui.define([], function () {
  "use strict";
  var listeners = [];
  var sequence = 1002;
  var requests = [{
    id: "PR-2026-1001", title: "현장 안전장비 구매", amount: 4800000,
    requester: "김현장", status: "REQUESTED", createdAt: "2026-07-30"
  }];
  function copy() { return requests.map(function (request) { return Object.assign({}, request); }); }
  function notify(eventType, request) {
    listeners.forEach(function (listener) { listener(copy()); });
    window.postMessage({
      messageId: "workflow-" + Date.now() + "-" + Math.random(), source: "purchase-workflow", target: "portal",
      eventType: eventType, payload: { requestId: request.id, title: request.title, amount: request.amount, status: request.status }, timestamp: new Date().toISOString()
    }, window.location.origin);
  }
  function find(id) { return requests.filter(function (request) { return request.id === id; })[0]; }
  return {
    getRequests: copy,
    subscribe: function (listener) { listeners.push(listener); return function () { listeners = listeners.filter(function (item) { return item !== listener; }); }; },
    create: function (title, amount) {
      var request = { id: "PR-2026-" + sequence++, title: title, amount: Number(amount), requester: "현재 사용자", status: "REQUESTED", createdAt: new Date().toISOString().slice(0, 10) };
      requests.unshift(request); notify("PURCHASE_REQUEST_CREATED", request); return request;
    },
    reviewBudget: function (id) { var request = find(id); if (!request) return; request.status = "BUDGET_APPROVED"; notify("PURCHASE_BUDGET_APPROVED", request); },
    approve: function (id) { var request = find(id); if (!request) return; request.status = "APPROVED"; notify("PURCHASE_APPROVED", request); },
    reject: function (id) { var request = find(id); if (!request) return; request.status = "REJECTED"; notify("PURCHASE_REJECTED", request); }
  };
});
