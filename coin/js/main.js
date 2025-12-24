async function api(url, method="GET", body=null){
  const opt = { method, headers: { "Content-Type": "application/json" } };
  if(body) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  return await r.json();
}

function fmt(n){
  return (n ?? 0).toLocaleString("ko-KR");
}

function bookRow(level){
  return `
    <div class="bookrow" data-price="${level.price}">
      <div class="p">${fmt(level.price)}</div>
      <div class="q">${fmt(level.qty)}</div>
    </div>
  `;
}

function rawRow(o){
  return `
    <div class="rawrow">
      <div class="mono">${o.id}</div>
      <div>${o.side.toUpperCase()} @ ${fmt(o.price)} x ${fmt(o.qty)}</div>
      <button class="btn small danger" data-oid="${o.id}">삭제</button>
    </div>
  `;
}
