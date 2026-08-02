import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const budget = 2400000;
const vendors = [
  { id: "VND-00124", name: "에스텍솔루션", type: "우수 협력사", amount: 2180000, delivery: "2026.08.09", deliveryValue: "2026-08-09", rating: 4.8, status: "추천", tone: "success" },
  { id: "VND-00087", name: "케이파워테크", type: "일반 협력사", amount: 2260000, delivery: "2026.08.12", deliveryValue: "2026-08-12", rating: 4.6, status: "적합", tone: "info" },
  { id: "VND-00231", name: "하이엔지니어링", type: "신규 협력사", amount: 2390000, delivery: "2026.08.07", deliveryValue: "2026-08-07", rating: 4.3, status: "추가 검토", tone: "warning" }
];
const won = value => `₩ ${value.toLocaleString("ko-KR")}`;
const savingRate = amount => ((budget - amount) / budget * 100).toFixed(1);

function App() {
  const [selectedId, setSelectedId] = useState(vendors[0].id);
  const [sent, setSent] = useState(false);
  const selected = useMemo(() => vendors.find(vendor => vendor.id === selectedId) ?? vendors[0], [selectedId]);
  useEffect(() => {
    window.parent.postMessage({ messageId: `react-context-${Date.now()}`, source: "react-procurement", target: "portal", eventType: "AI_CONTEXT_CHANGED", payload: { applicationId: "react-procurement-app", kind: "VENDOR_QUOTATION", title: selected.name, entityId: "PR-2026-1002", summary: "React 견적 대시보드 · 선택된 협력사", fields: [{ label: "견적 금액", value: won(selected.amount) }, { label: "예산 대비", value: `${savingRate(selected.amount)}% 절감`, state: "Success" }, { label: "납기 예정", value: selected.delivery }, { label: "거래 평가", value: `${selected.rating} / 5.0` }], data: { budget, selected, vendors } }, timestamp: new Date().toISOString() }, window.location.origin);
  }, [selected]);
  const selectVendor = id => { setSelectedId(id); setSent(false); };
  const send = () => {
    parent.postMessage({ messageId: `react-${Date.now()}`, source: "react-procurement", target: "portal", eventType: "REACT_VENDOR_SELECTED", payload: { requestId: "PR-2026-1002", vendor: selected.name, amount: selected.amount, deliveryDate: selected.deliveryValue }, timestamp: new Date().toISOString() }, location.origin);
    setSent(true);
  };

  return <main className="app-shell">
    <header className="page-heading">
      <div><div className="eyebrow">PROCUREMENT ANALYTICS <span>REACT</span></div><h1>견적 분석 대시보드</h1><p>PR-2026-1002 · 발전소 제어반 부품 구매</p></div>
      <div className="deadline"><div className="deadline-icon">◷</div><div><small>견적 마감</small><strong>2026.08.02 18:00</strong></div></div>
    </header>
    <section className="kpi-grid" aria-label="견적 요약">
      <article className="kpi"><small>요청 예산</small><strong>{won(budget)}</strong></article>
      <article className="kpi purple"><small>접수 견적</small><strong>3건 <em>100% 접수</em></strong></article>
      <article className="kpi green"><small>최저 견적</small><strong>{won(vendors[0].amount)}</strong></article>
      <article className="kpi orange"><small>예상 절감</small><strong>{won(budget - vendors[0].amount)} <em>9.2%</em></strong></article>
    </section>
    <section className="data-card">
      <div className="card-heading"><strong>협력사별 견적 비교</strong><span>가격·납기·평가 기반 비교 분석</span></div>
      <div className="table-wrap"><table><thead><tr><th className="pick">선택</th><th>협력사</th><th>견적 금액</th><th>예산 대비</th><th>납기 예정</th><th>거래 평가</th><th>검토 상태</th></tr></thead>
        <tbody>{vendors.map(vendor => <tr key={vendor.id} className={selectedId === vendor.id ? "selected" : ""} onClick={() => selectVendor(vendor.id)} tabIndex="0" onKeyDown={event => { if (event.key === "Enter" || event.key === " ") selectVendor(vendor.id); }}>
          <td className="pick"><input className="vendor-radio" type="radio" name="react-vendor" value={vendor.id} checked={selectedId === vendor.id} aria-label={`${vendor.name} 선택`} onClick={event => event.stopPropagation()} onChange={() => selectVendor(vendor.id)} /></td><td className="vendor"><strong>{vendor.name}</strong><small>{vendor.id} · {vendor.type}</small></td><td className="amount">{won(vendor.amount)}</td><td className="saving">-{savingRate(vendor.amount)}%</td><td>{vendor.delivery}</td><td className="rating">★ <strong>{vendor.rating}</strong> / 5.0</td><td><span className={`status ${vendor.tone}`}>{vendor.status}</span></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <footer className="action-bar">
      <div className="selection"><small>선정 협력사</small><strong>{selected.name} · {won(selected.amount)} <em>예산 절감 {savingRate(selected.amount)}%</em></strong></div>
      <div className={`connection ${sent ? "sent" : ""}`} role="status">{sent ? "선정 결과 전송 완료" : "Portal 연결 정상"}</div>
      <button type="button" onClick={send}>선정 결과 전송</button>
    </footer>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
