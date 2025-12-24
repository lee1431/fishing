const pill = document.getElementById("pillState");

async function refresh(){
  const st = await api("https://mrdindoin.ddns.net/coin/api/state");
  const book = await api("https://mrdindoin.ddns.net/coin/api/book?depth=12");

  pill.textContent = `${book.symbol} | 상장 ${fmt(book.list_price)} | 현재 ${fmt(book.last_price)} | 세력 코인 ${fmt(st.operator_inventory)} | 현금 ${fmt(st.operator_cash)}`;

  document.getElementById("asks").innerHTML = book.asks.map(bookRow).join("") || "<div class='muted'>없음</div>";
  document.getElementById("bids").innerHTML = book.bids.map(bookRow).join("") || "<div class='muted'>없음</div>";

  document.getElementById("rawAsks").innerHTML = (book.raw.asks || []).map(rawRow).join("") || "<div class='muted'>없음</div>";
  document.getElementById("rawBids").innerHTML = (book.raw.bids || []).map(rawRow).join("") || "<div class='muted'>없음</div>";

  // bind cancel buttons
  document.querySelectorAll("[data-oid]").forEach(btn=>{
    btn.onclick = async () => {
      const oid = btn.getAttribute("data-oid");
      const res = await api("https://mrdindoin.ddns.net/coin/api/order/cancel", "POST", { order_id: oid });
      if(!res.ok) alert("삭제 실패");
      refresh();
    };
  });
}

document.getElementById("btnPlace").onclick = async () => {
  const side = document.getElementById("side").value;
  const price = parseInt(document.getElementById("price").value || "0", 10);
  const qty = parseInt(document.getElementById("qty").value || "0", 10);
  const res = await api("https://mrdindoin.ddns.net/coin/api/operator/order", "POST", { side, price, qty });
  if(!res.ok) alert(res.error || "실패");
  refresh();
};

document.getElementById("btnSetSymbol").onclick = async () => {
  const symbol = document.getElementById("symbol").value || "SANGCOIN";
  const list_price = parseInt(document.getElementById("listPrice").value || "1000", 10);
  const reset = document.getElementById("resetBook").checked;
  const res = await api("https://mrdindoin.ddns.net/coin/api/symbol", "POST", { symbol, list_price, reset });
  if(!res.ok) alert("적용 실패");
  refresh();
};

refresh();
setInterval(refresh, 800);
