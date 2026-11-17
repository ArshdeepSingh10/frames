let D=null,sig='',R=null;
document.title=C.SHOP_NAME+' – Custom Shadowbox Frames';$('#sn').textContent=C.SHOP_NAME;
async function load(){$('#g').innerHTML='<div class="sk"></div>'.repeat(4);try{D=await get();sig=JSON.stringify(D);show();}catch(e){$('#g').innerHTML='<div class="msg">Could not load products (server slow or offline).<br><br><button class="btn" onclick="load()">Try again</button></div>';}}
async function sync(){if(document.hidden||!sig||$('#bd').open)return;try{const d=await get(),s=JSON.stringify(d);if(s!==sig){sig=s;D=d;show();}}catch(e){}}
setInterval(sync,20000);document.addEventListener('visibilitychange',sync);
function show(){const w=String(D.whatsapp).replace(/\D/g,'');if(/^\d{10,13}$/.test(w)){$('#wa').href='https://wa.me/'+w;$('#wa').hidden=false;}
  $('#g').innerHTML=D.products.length?D.products.map(p=>`<div class="card${p.available?'':' oos'}"><div class="im"><img loading="lazy" src="${esc(thumb(p.images[0],700))}" alt="${esc(p.name)}">${p.available?'':'<span class="badge">Sold out</span>'}</div><div class="tx"><b class="nm">${esc(p.name)}</b><small>${esc(p.description)}</small>${p.slotsLeft!==null&&p.available?`<small>${p.slotsLeft} left</small>`:''}<div class="pr"><span class="price">${money(p.price)}</span><button class="btn" data-id="${esc(p.id)}"${p.available?'':' disabled'}>View</button></div></div></div>`).join(''):'<div class="msg">Ready-made frames are coming soon. You can already <a href="studio.html">design your own</a>.</div>';}
$('#g').onclick=e=>{const b=e.target.closest('[data-id]');if(b&&!b.disabled)openR(b.dataset.id);};
const tot=()=>R.p.price+(D.leds.find(l=>l.name===R.led)||{price:0}).price;
function openR(id){const p=D.products.find(x=>x.id===id);R={p,led:D.leds[0].name};const sp=Object.entries(p.specs||{});
  $('#bd').innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>${esc(p.name)}</h2><img class="pimg" id="mi" src="${esc(thumb(p.images[0],1000))}" alt="${esc(p.name)}">
  ${p.images.length>1?`<div class="th2">${p.images.map((u,i)=>`<img class="${i?'':'on'}" src="${esc(thumb(u,120))}" data-f="${esc(thumb(u,1000))}" alt="">`).join('')}</div>`:''}<p class="mu">${esc(p.description)}</p>
  ${sp.length?`<table class="spec">${sp.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`:''}
  <div class="og"><label>LED lighting</label>${chips('led',D.leds.map(l=>({v:l.name,t:l.price?`${l.name} (+${money(l.price)})`:l.name})),R.led)}</div>${contact()}<div class="tt"><div><span>${esc(p.name)}</span><span>${money(p.price)}</span></div><div class="gt"><span>Total</span><span id="rt">${money(tot())}</span></div></div>
  <div class="er" id="be"></div><div class="ft"><button class="btn" id="bsend">Place order</button></div><small class="mu">No online payment: after ordering you get UPI / WhatsApp details to pay the shop directly.</small></div>`;$('#bd').showModal();}
$('#bd').addEventListener('click',async e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();if(!R)return;
  if(t.dataset.f){$('#mi').src=t.dataset.f;t.parentNode.querySelectorAll('img').forEach(x=>x.classList.toggle('on',x===t));return;}
  const c=t.closest('.ch[data-k]');if(c){R.led=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));$('#rt').textContent=money(tot());}
  if(t.id==='bsend'){const er=$('#be'),ct=readC(),m=checkC(ct);er.textContent=m;if(m)return;t.disabled=true;t.textContent='Placing order…';
    try{const r=await post({action:'order',kind:'ready',designId:R.p.id,led:R.led,...ct});d.innerHTML=payHtml(r,ct.name);R=null;load();}catch(x){er.textContent=x.message;t.disabled=false;t.textContent='Place order';}}});
load();
