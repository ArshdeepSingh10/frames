let D=null,sig='',R=null;
document.title=C.SHOP_NAME+' – Custom Shadowbox Frames';$('#sn').textContent=C.SHOP_NAME;
async function load(){$('#g').innerHTML='<div class="sk"></div>'.repeat(4);try{D=await get();sig=JSON.stringify(D);show();}catch(e){$('#g').innerHTML='<div class="msg">Could not load designs (server slow or offline).<br><br><button class="btn" onclick="load()">Try again</button></div>';}}
async function sync(){if(document.hidden||!sig||$('#bd').open)return;try{const d=await get(),s=JSON.stringify(d);if(s!==sig){sig=s;D=d;show();}}catch(e){}}
setInterval(sync,20000);document.addEventListener('visibilitychange',sync);
const fr=id=>D.frames.find(f=>f.id===id);
function show(){const w=String(D.whatsapp).replace(/\D/g,'');if(/^\d{10,13}$/.test(w)){$('#wa').href='https://wa.me/'+w;$('#wa').hidden=false;}
  $('#g').innerHTML=D.designs.length?D.designs.map(d=>{const f=fr(d.frameId),ok=f&&f.available;return `<div class="card${ok?'':' oos'}"><div class="im"><img loading="lazy" src="${esc(thumb(d.image,700))}" alt="${esc(d.name)}">${ok?'':'<span class="badge">Sold out</span>'}</div><div class="tx"><b class="nm">${esc(d.name)}</b><small>${esc(d.description)}</small><small>${f?esc(f.name)+(ok?` · ${f.total-f.booked} slots left`:''):''}</small><div class="pr"><span class="price">${money(d.price)}</span><button class="btn" data-id="${esc(d.id)}"${ok?'':' disabled'}>Order</button></div></div></div>`;}).join(''):'<div class="msg">Ready-made designs are coming soon. You can already <a href="studio.html">design your own</a>.</div>';}
$('#g').onclick=e=>{const b=e.target.closest('[data-id]');if(b&&!b.disabled)openR(b.dataset.id);};
const tot=()=>R.d.price+(D.leds.find(l=>l.name===R.led)||{price:0}).price;
function openR(id){const d=D.designs.find(x=>x.id===id);R={d,led:D.leds[0].name};
  $('#bd').innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>${esc(d.name)}</h2><img class="pimg" src="${esc(thumb(d.image,900))}" alt="${esc(d.name)}"><p class="mu">${esc(d.description)}</p>
  <div class="og"><label>LED lighting</label>${chips('led',D.leds.map(l=>({v:l.name,t:l.price?`${l.name} (+${money(l.price)})`:l.name})),R.led)}</div>${contact()}<div class="tt"><div><span>${esc(d.name)}</span><span>${money(d.price)}</span></div><div class="gt"><span>Total</span><span id="rt">${money(tot())}</span></div></div>
  <div class="er" id="be"></div><button class="btn" id="bsend">Place order</button><small class="mu">No online payment: after ordering you will get UPI / WhatsApp details to pay the shop directly.</small></div>`;$('#bd').showModal();}
$('#bd').addEventListener('click',async e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();if(!R)return;
  const c=t.closest('.ch[data-k]');if(c){R.led=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));$('#rt').textContent=money(tot());}
  if(t.id==='bsend'){const er=$('#be'),ct=readC(),m=checkC(ct);er.textContent=m;if(m)return;t.disabled=true;t.textContent='Placing order…';
    try{const r=await post({action:'order',kind:'ready',designId:R.d.id,led:R.led,...ct});d.innerHTML=payHtml(r,ct.name);R=null;load();}catch(x){er.textContent=x.message;t.disabled=false;t.textContent='Place order';}}});
load();
