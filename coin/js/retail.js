const pill = document.getElementById("pillState");
let USER_ID = localStorage.getItem("retail_user_id") || "";

function renderMe(me, st){
  document.getElementById("me").innerHTML = `
    <div class="stat"><div class="k">닉네임</div><div class="v">${me.name}</div></div>
    <div class="stat"><div class="k">현금</div><div class="v">${fmt(me.cash)}</div></div>
    <div class="stat"><div class="k">코인</div><div class="v">${fmt(me.coin)}</div></div>
    <div class="stat"><div class="k">NAV</div><div class="v">${fmt(me.nav)}</div></div>
    <div class="stat"><div class="k">에어드랍</div><div class="v">${fmt(st.airdrop_amount)} / ${st.airdrop_period_sec}s</div></div>
  `;
}

function renderRank(rows){
  const html = rows.map((r, i)=>`
    <div class="rankrow">
      <div class="mono">#${i+1}</div>
      <div>${r.name}</div>
      <div class="mono">NAV ${fmt(r.nav)}</div>
      <div class="mono">C ${fmt(r.cash)} / K ${fmt(r.coin)}</div>
    </div>
  `).join("");
  document.getElementById("rank").innerHTML = html || "<div class='muted'>참가자 없음</div>";
}

function renderTrades(trades){
  const html = (trades||[]).slice().reverse().map(t=>`
    <div class="rawrow">
      <div class="mono">${new Date(t.ts*1000).toLocaleTimeString()}</div>
      <div>체결 ${fmt(t.price)} x ${fmt(t.qty)}</div>
    </div>
  `).join("");
  document.getElementById("trades").innerHTML = html || "<div class='muted'>체결 없음</div>";
}

async function refresh(){
  const st = await api("https://mrdindoin.ddns.net/coin/api/state");
  const book = await api("https://mrdindoin.ddns.net/coin/api/book?depth=12");
  pill.textContent = `${book.symbol} | 상장 ${fmt(book.list_price)} | 현재 ${fmt(book.last_price)}`;

  document.getElementById("asks").innerHTML = book.asks.map(bookRow).join("") || "<div class='muted'>없음</div>";
  document.getElementById("bids").innerHTML = book.bids.map(bookRow).join("") || "<div class='muted'>없음</div>";

  // click price fill
  document.querySelectorAll(".book.clickable .bookrow").forEach(el=>{
    el.onclick = () => {
      document.getElementById("price").value = el.getAttribute("data-price");
    };
  });

  renderTrades(book.trades);

  const rank = await api("https://mrdindoin.ddns.net/coin/api/rank");
  if(rank.ok) renderRank(rank.rows);

  if(USER_ID){
    const me = await api("https://mrdindoin.ddns.net/coin/api/retail/airdrop", "POST", { user_id: USER_ID });
    if(me.ok) renderMe(me, st);
  }
}

document.getElementById("btnJoin").onclick = async () => {
  const name = document.getElementById("name").value || "익명";
  const res = await api("https://mrdindoin.ddns.net/coin/api/retail/join", "POST", { user_id: USER_ID || undefined, name });
  if(!res.ok) return alert(res.error || "참가 실패");
  USER_ID = res.user_id;
  localStorage.setItem("retail_user_id", USER_ID);
  const st = await api("https://mrdindoin.ddns.net/coin/api/state");
  renderMe(res, st);
  refresh();
};

document.getElementById("btnAirdrop").onclick = async () => {
  if(!USER_ID) return alert("먼저 참가");
  await refresh();
};

document.getElementById("btnOrder").onclick = async () => {
  if(!USER_ID) return alert("먼저 참가");
  const side = document.getElementById("side").value;
  const price = parseInt(document.getElementById("price").value || "0", 10);
  const qty = parseInt(document.getElementById("qty").value || "0", 10);
  const res = await api("https://mrdindoin.ddns.net/coin/api/retail/order", "POST", { user_id: USER_ID, side, price, qty });
  if(!res.ok) alert(res.error || "주문 실패");
  refresh();
};

refresh();
setInterval(refresh, 800);
