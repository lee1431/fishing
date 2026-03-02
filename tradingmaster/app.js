const $ = (id) => document.getElementById(id);

const api = {
  async load() {
    const r = await fetch("https://mrdindoin.ddns.net/tm/api/data");
    if (!r.ok) throw new Error("load failed");
    return r.json();
  },
  async save(payload) {
    const r = await fetch("https://mrdindoin.ddns.net/tm/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || "save failed");
    return j;
  },
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeCompleteness(e) {
  const required = [
    e.marketSummaryDone,
    !!e.bias,
    !!e.rationale1,
    !!e.rationale2,
    !!e.rationale3,
    e.stopSet,
    e.targetSet,
    !!e.rr,
    !!e.emotion,
    e.oneEntryOnly,
    !!e.result,
  ];
  const done = required.filter(Boolean).length;
  return Math.round((done / required.length) * 100);
}

function parseRR(rr) {
  // "1:2.5" => 2.5, "2" => 2, "1 : 2" => 2
  if (!rr) return null;
  const s = String(rr).trim();
  if (s.includes(":")) {
    const parts = s.split(":").map((x) => x.trim());
    const b = parseFloat(parts[1]);
    return Number.isFinite(b) ? b : null;
  }
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

let state = {
  entries: [],
  selectedId: null,
};

function formToEntry() {
  return {
    id: state.selectedId || `${$("date").value}-${Math.random().toString(16).slice(2)}`,
    date: $("date").value,
    marketSummaryDone: $("marketSummaryDone").checked,
    bias: $("bias").value,
    rationale1: $("r1").value.trim(),
    rationale2: $("r2").value.trim(),
    rationale3: $("r3").value.trim(),
    stopSet: $("stopSet").checked,
    targetSet: $("targetSet").checked,
    rr: $("rr").value.trim(),
    emotion: $("emotion").value.trim(),
    oneEntryOnly: $("oneEntryOnly").checked,
    result: $("result").value,
    notes: $("notes").value.trim(),
    updatedAt: Date.now(),
  };
}

function entryToForm(e) {
  state.selectedId = e.id;
  $("date").value = e.date || todayISO();
  $("marketSummaryDone").checked = !!e.marketSummaryDone;
  $("bias").value = e.bias || "";
  $("r1").value = e.rationale1 || "";
  $("r2").value = e.rationale2 || "";
  $("r3").value = e.rationale3 || "";
  $("stopSet").checked = !!e.stopSet;
  $("targetSet").checked = !!e.targetSet;
  $("rr").value = e.rr || "";
  $("emotion").value = e.emotion || "";
  $("oneEntryOnly").checked = e.oneEntryOnly !== false;
  $("result").value = e.result || "";
  $("notes").value = e.notes || "";
  render();
}

function clearSelection() {
  state.selectedId = null;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function renderStats() {
  const entries = state.entries;
  const completeness = entries.length
    ? Math.round(entries.reduce((acc, e) => acc + computeCompleteness(e), 0) / entries.length)
    : 0;

  const violations = entries.filter((e) => e.oneEntryOnly === false).length;

  const w = entries.filter((e) => e.result === "승").length;
  const l = entries.filter((e) => e.result === "패").length;
  const d = entries.filter((e) => e.result === "무").length;

  const rrVals = entries.map((e) => parseRR(e.rr)).filter((v) => v != null);
  const avgRR = rrVals.length ? (rrVals.reduce((a, b) => a + b, 0) / rrVals.length).toFixed(2) : "-";

  $("completeness").textContent = `${completeness}%`;
  $("violations").textContent = `${violations}`;
  $("wld").textContent = `${w}/${l}/${d}`;
  $("avgRR").textContent = avgRR;
}

function renderList() {
  const tbody = $("list");
  tbody.innerHTML = "";
  const entries = sortEntries(state.entries);

  for (const e of entries) {
    const tr = document.createElement("tr");
    const comp = computeCompleteness(e);

    tr.style.cursor = "pointer";
    tr.style.opacity = state.selectedId === e.id ? "1" : "0.92";
    tr.onclick = () => entryToForm(e);

    const oneOk = e.oneEntryOnly !== false;
    const resClass = e.result === "승" ? "ok" : e.result === "패" ? "bad" : "warn";

    tr.innerHTML = `
      <td>${e.date || ""}</td>
      <td>${e.bias || ""}</td>
      <td>${comp}%</td>
      <td class="${oneOk ? "ok" : "bad"}">${oneOk ? "O" : "X"}</td>
      <td class="${resClass}">${e.result || ""}</td>
      <td class="right">${e.rr || ""}</td>
    `;
    tbody.appendChild(tr);
  }
}

function render() {
  renderStats();
  renderList();
}

async function loadFromServer() {
  const data = await api.load();
  state.entries = Array.isArray(data.entries) ? data.entries : [];
  clearSelection();
  render();
}

async function saveToServer() {
  await api.save({ entries: state.entries });
}

function downloadJSON(obj, filename = "tmcm_data.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  $("date").value = todayISO();

  // auto recalc (form changes just update pill stats based on stored entries; completeness pill is avg of entries)
  // but user expects immediate feedback? keep simple.

  $("btnReload").onclick = async () => {
    try { await loadFromServer(); } catch (e) { alert("불러오기 실패: " + e.message); }
  };

  $("btnAdd").onclick = async () => {
    try {
      const e = formToEntry();
      if (!e.date) return alert("날짜를 선택해줘.");
      // 하루 1개 기록만 강제하려면 여기서 date 중복 체크
      // 지금은 허용(여러 전략/세션 기록용). 원하면 강제 모드로 바꿔줄게.
      state.entries.push(e);
      await saveToServer();
      clearSelection();
      render();
      alert("저장 완료(추가).");
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  $("btnUpdate").onclick = async () => {
    try {
      if (!state.selectedId) return alert("목록에서 기록을 하나 선택해줘.");
      const e = formToEntry();
      const idx = state.entries.findIndex((x) => x.id === state.selectedId);
      if (idx < 0) return alert("선택 기록을 찾을 수 없어.");
      state.entries[idx] = { ...state.entries[idx], ...e };
      await saveToServer();
      render();
      alert("업데이트 완료.");
    } catch (err) {
      alert("업데이트 실패: " + err.message);
    }
  };

  $("btnDelete").onclick = async () => {
    try {
      if (!state.selectedId) return alert("삭제할 기록을 선택해줘.");
      if (!confirm("정말 삭제할까?")) return;
      state.entries = state.entries.filter((x) => x.id !== state.selectedId);
      await saveToServer();
      clearSelection();
      render();
      alert("삭제 완료.");
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  $("btnExport").onclick = () => {
    downloadJSON({ entries: state.entries }, `tmcm_export_${todayISO()}.json`);
  };

  $("importFile").addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.entries)) throw new Error("entries 배열이 필요해.");
      // merge or replace? 여기선 replace
      state.entries = obj.entries;
      await saveToServer();
      clearSelection();
      render();
      alert("가져오기 완료.");
    } catch (e) {
      alert("가져오기 실패: " + e.message);
    } finally {
      ev.target.value = "";
    }
  });

  // 첫 로드
  loadFromServer().catch(() => {
    // 서버 data.json이 없거나 첫 실행이면 빈 상태
    state.entries = [];
    render();
  });
}

init();
