<script setup>
import { computed, ref, watch } from "vue";

const budget = 2400000;
const vendors = [
  { id: "VND-00124", name: "에스텍솔루션", type: "우수 협력사", amount: 2180000, delivery: "2026.08.09", deliveryValue: "2026-08-09", rating: 4.8, status: "추천", tone: "success" },
  { id: "VND-00087", name: "케이파워테크", type: "일반 협력사", amount: 2260000, delivery: "2026.08.12", deliveryValue: "2026-08-12", rating: 4.6, status: "적합", tone: "info" },
  { id: "VND-00231", name: "하이엔지니어링", type: "신규 협력사", amount: 2390000, delivery: "2026.08.07", deliveryValue: "2026-08-07", rating: 4.3, status: "추가 검토", tone: "warning" }
];
const selectedId = ref(vendors[0].id);
const sent = ref(false);
const selected = computed(() => vendors.find(vendor => vendor.id === selectedId.value) ?? vendors[0]);
const won = value => `₩ ${value.toLocaleString("ko-KR")}`;
const savingRate = amount => ((budget - amount) / budget * 100).toFixed(1);
watch(selected, vendor => {
  window.parent.postMessage({ messageId: `vue-context-${Date.now()}`, source: "vue-procurement", target: "portal", eventType: "AI_CONTEXT_CHANGED", payload: { applicationId: "vue-procurement-app", kind: "VENDOR_QUOTATION", title: vendor.name, entityId: "PR-2026-1002", summary: "Vue 견적 대시보드 · 선택된 협력사", fields: [{ label: "견적 금액", value: won(vendor.amount) }, { label: "예산 대비", value: `${savingRate(vendor.amount)}% 절감`, state: "Success" }, { label: "납기 예정", value: vendor.delivery }, { label: "거래 평가", value: `${vendor.rating} / 5.0` }], data: { budget, selected: vendor, vendors } }, timestamp: new Date().toISOString() }, window.location.origin);
}, { immediate: true });
function selectVendor(id) { selectedId.value = id; sent.value = false; }
function send() {
  window.parent.postMessage({ messageId: `vue-${Date.now()}`, source: "vue-procurement", target: "portal", eventType: "VUE_VENDOR_SELECTED", payload: { requestId: "PR-2026-1002", vendor: selected.value.name, amount: selected.value.amount, deliveryDate: selected.value.deliveryValue }, timestamp: new Date().toISOString() }, window.location.origin);
  sent.value = true;
}
</script>

<template>
  <main class="app-shell">
    <header class="page-heading">
      <div><div class="eyebrow">PROCUREMENT ANALYTICS <span>VUE</span></div><h1>견적 분석 대시보드</h1><p>PR-2026-1002 · 발전소 제어반 부품 구매</p></div>
      <div class="deadline"><div class="deadline-icon">◷</div><div><small>견적 마감</small><strong>2026.08.02 18:00</strong></div></div>
    </header>
    <section class="kpi-grid" aria-label="견적 요약">
      <article class="kpi"><small>요청 예산</small><strong>{{ won(budget) }}</strong></article>
      <article class="kpi purple"><small>접수 견적</small><strong>3건 <em>100% 접수</em></strong></article>
      <article class="kpi green"><small>최저 견적</small><strong>{{ won(vendors[0].amount) }}</strong></article>
      <article class="kpi orange"><small>예상 절감</small><strong>{{ won(budget - vendors[0].amount) }} <em>9.2%</em></strong></article>
    </section>
    <section class="data-card">
      <div class="card-heading"><strong>협력사별 견적 비교</strong><span>가격·납기·평가 기반 비교 분석</span></div>
      <div class="table-wrap"><table><thead><tr><th class="pick">선택</th><th>협력사</th><th>견적 금액</th><th>예산 대비</th><th>납기 예정</th><th>거래 평가</th><th>검토 상태</th></tr></thead>
        <tbody><tr v-for="vendor in vendors" :key="vendor.id" :class="{ selected: selectedId === vendor.id }" tabindex="0" @click="selectVendor(vendor.id)" @keydown.enter="selectVendor(vendor.id)" @keydown.space.prevent="selectVendor(vendor.id)">
          <td class="pick"><input class="vendor-radio" type="radio" name="vue-vendor" :value="vendor.id" :checked="selectedId === vendor.id" :aria-label="`${vendor.name} 선택`" @click.stop @change="selectVendor(vendor.id)" /></td><td class="vendor"><strong>{{ vendor.name }}</strong><small>{{ vendor.id }} · {{ vendor.type }}</small></td><td class="amount">{{ won(vendor.amount) }}</td><td class="saving">-{{ savingRate(vendor.amount) }}%</td><td>{{ vendor.delivery }}</td><td class="rating">★ <strong>{{ vendor.rating }}</strong> / 5.0</td><td><span class="status" :class="vendor.tone">{{ vendor.status }}</span></td>
        </tr></tbody>
      </table></div>
    </section>
    <footer class="action-bar">
      <div class="selection"><small>선정 협력사</small><strong>{{ selected.name }} · {{ won(selected.amount) }} <em>예산 절감 {{ savingRate(selected.amount) }}%</em></strong></div>
      <div class="connection" :class="{ sent }" role="status">{{ sent ? "선정 결과 전송 완료" : "Portal 연결 정상" }}</div>
      <button type="button" @click="send">선정 결과 전송</button>
    </footer>
  </main>
</template>

<style>
:root{font-family:"72","Apple SD Gothic Neo","Segoe UI",Arial,sans-serif;color:#193b59;background:#f3f6f9;font-synthesis:none}*{box-sizing:border-box}body{margin:0;min-width:640px}.app-shell{min-height:100vh;padding:14px;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:10px}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:20px}.eyebrow{margin-bottom:4px;color:#0a6ed1;font-size:10px;font-weight:800;letter-spacing:.12em}.eyebrow span{margin-left:5px;padding:2px 6px;border-radius:99px;background:#e6f7f1;color:#16885f;letter-spacing:.05em}.page-heading h1{margin:0;color:#153d60;font-size:21px;line-height:1.2}.page-heading p{margin:3px 0 0;color:#688095;font-size:12px}.deadline{display:flex;align-items:center;gap:9px;padding:7px 11px;border:1px solid #cfe0ed;border-radius:8px;background:#fff;white-space:nowrap}.deadline-icon{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#fff0dc;color:#b85c00;font-size:15px}.deadline small{display:block;color:#718699;font-size:10px}.deadline strong{display:block;color:#314f68;font-size:12px}.kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kpi{position:relative;padding:9px 11px 8px;border:1px solid #dbe5ed;border-radius:8px;background:#fff;box-shadow:0 2px 7px rgba(31,65,94,.05)}.kpi:before{position:absolute;inset:0 auto 0 0;width:3px;border-radius:8px 0 0 8px;background:#0a6ed1;content:""}.kpi.green:before{background:#18864b}.kpi.orange:before{background:#e9730c}.kpi.purple:before{background:#7457c7}.kpi small{display:block;color:#6e8295;font-size:10px}.kpi strong{display:block;margin-top:3px;color:#173d5e;font-size:15px}.kpi em{margin-left:5px;color:#18864b;font-size:10px;font-style:normal}.data-card{min-height:0;overflow:hidden;display:flex;flex-direction:column;border:1px solid #d8e3ec;border-radius:9px;background:#fff;box-shadow:0 3px 10px rgba(25,61,95,.06)}.card-heading{display:flex;justify-content:space-between;align-items:center;padding:8px 11px;border-bottom:1px solid #e1e9f0}.card-heading strong{font-size:13px}.card-heading span{color:#708599;font-size:10px}.table-wrap{min-height:0;overflow:auto}table{width:100%;border-collapse:collapse}th{padding:7px 10px;background:#f4f7fa;color:#536d82;font-size:10px;font-weight:800;text-align:left;white-space:nowrap}td{padding:8px 10px;border-top:1px solid #e6edf2;color:#3f5c72;font-size:12px;white-space:nowrap}tbody tr{cursor:pointer;transition:background .15s}tbody tr:hover{background:#f5faff}tbody tr.selected{background:#eaf5ff}tbody tr.selected td:first-child{box-shadow:inset 3px 0 #18864b}.rank{display:grid;width:20px;height:20px;place-items:center;border-radius:6px;background:#edf2f6;color:#5b7183;font-size:10px;font-weight:800}.rank-1{background:#fff0c2;color:#916000}.vendor strong{display:block;color:#173f61}.vendor small{display:block;margin-top:2px;color:#7a8d9d;font-size:9px}.amount{color:#173d5d;font-weight:700}.saving{color:#18864b;font-weight:800}.rating{color:#e2a000}.rating strong{color:#31546f}.status{display:inline-block;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:800}.status.success{background:#e8f6ed;color:#107e3e}.status.info{background:#eaf4ff;color:#0a6ed1}.status.warning{background:#fff1df;color:#a45100}.action-bar{display:flex;align-items:center;gap:12px;min-height:50px;padding:8px 10px;border:1px solid #d8e3ec;border-radius:9px;background:#fff;box-shadow:0 2px 7px rgba(25,61,95,.05)}.selection{min-width:0;flex:1}.selection small{display:block;color:#708599;font-size:10px}.selection strong{display:block;overflow:hidden;margin-top:2px;color:#173f61;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.selection em{margin-left:6px;color:#18864b;font-style:normal}.connection{display:flex;align-items:center;gap:5px;color:#557087;font-size:10px;white-space:nowrap}.connection:before{width:7px;height:7px;border-radius:50%;background:#18864b;box-shadow:0 0 0 3px #e6f5eb;content:""}.connection.sent{color:#107e3e;font-weight:700}button{padding:8px 13px;border:0;border-radius:6px;background:#0a6ed1;color:#fff;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}button:hover{background:#085caf}button:focus-visible{outline:3px solid #b7daf7;outline-offset:2px}@media(max-width:760px){.app-shell{padding:10px}.kpi-grid{grid-template-columns:repeat(2,1fr)}.deadline,.connection{display:none}}
.eyebrow{font-size:11px}.page-heading h1{font-size:24px}.page-heading p{font-size:13px}.deadline-icon{font-size:16px}.deadline small{font-size:11px}.deadline strong{font-size:13px}.kpi small{font-size:11px}.kpi strong{font-size:17px}.kpi em{font-size:11px}.card-heading strong{font-size:14px}.card-heading span{font-size:11px}th{padding:8px 11px;font-size:12px;line-height:1.25}td{padding:9px 11px;font-size:13px;line-height:1.35}.pick{width:4rem;text-align:center}.vendor-radio{width:17px;height:17px;margin:0;appearance:none;border:1px solid #9eb4c5;border-radius:50%;background:#fff;vertical-align:middle;cursor:pointer}.vendor-radio:checked{border:5px solid #18864b}.vendor-radio:focus-visible{outline:3px solid #bce9d0;outline-offset:2px}.vendor small{font-size:11px;line-height:1.3}.status{font-size:11px}.selection small{font-size:11px}.selection strong{font-size:13px}.connection{font-size:11px}button{font-size:12px}
</style>
