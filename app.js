const C=CONFIG,$=s=>document.querySelector(s);let D=null,sig='',B=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>C.CURRENCY+Number(n).toLocaleString('en-IN');
const img=(u,w)=>u.replace('/upload/','/upload/f_auto,q_auto,w_'+w+'/');
const swatch=n=>{n=n.toLowerCase();return /black/.test(n)?'#0d0d0f':/gr[ae]y/.test(n)?'#4a4d52':/red/.test(n)?'#a3202b':/orange/.test(n)?'#d9621a':/blue/.test(n)?'#2f6da3':/green/.test(n)?'#1f6b4a':/white/.test(n)?'#e9e6df':/yellow/.test(n)?'#d6a812':'#2b2d31';};
const ledc=n=>/^no/i.test(n)?'':/warm/i.test(n)?'#ffcf7a':/cool/i.test(n)?'#cfe8ff':'rgb';
const pv=(n,bg,led,text)=>{const c=n<=3?n:n===4?2:3;return `<div class="sbx${led?' lit':''}${led==='rgb'?' rgb':''}" style="--bg:${swatch(bg)};--led:${led==='rgb'?'#7a5cff':led||'transparent'};--c:${c}"><div class="in">${'<i>🏎️</i>'.repeat(Math.min(n,6))}</div><div class="plq">${esc(text)||'&nbsp;'}</div></div>`;};
document.title=C.SHOP_NAME+' – Custom Shadowbox Frames';$('#sn').textContent=C.SHOP_NAME;$('#go').onclick=()=>$('#fr').scrollIntoView({behavior:'smooth'});
async function get(){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(C.API_URL+'?_='+Date.now(),{signal:ctl.signal}),j=await r.json();if(!j.ok)throw 0;return j.data;}finally{clearTimeout(tm);}}
async function post(body){const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body)}),j=await r.json();if(!j.ok)throw new Error(j.error);return j.data;}
async function load(){$('#g').innerHTML='<div class="sk"></div>'.repeat(4);try{D=await get();sig=JSON.stringify(D);show();}catch(e){$('#g').innerHTML='<div class="msg">Could not load frames (server slow or offline).<br><br><button class="btn" onclick="load()">Try again</button></div>';}}
async function sync(){if(document.hidden||!sig||$('#bd').open)return;try{const d=await get(),s=JSON.stringify(d);if(s!==sig){sig=s;D=d;show();}}catch(e){}}
setInterval(sync,20000);document.addEventListener('visibilitychange',sync);
function show(){const w=String(D.whatsapp).replace(/\D/g,'');if(/^\d{10,13}$/.test(w)){$('#wa').href='https://wa.me/'+w;$('#wa').hidden=false;}
  $('#g').innerHTML=D.frames.length?D.frames.map(f=>{const left=f.total-f.booked,pct=f.total?Math.round(f.booked/f.total*100):100;return `<div class="card${f.available?'':' oos'}"><div class="im">${f.image?`<img loading="lazy" src="${esc(img(f.image,600))}" alt="${esc(f.name)}">`:pv(f.maxCars,D.bgs[0],'',''.padEnd(0))}${f.available?'':'<span class="badge">Sold out</span>'}</div><div class="tx"><b class="nm">${esc(f.name)}</b><small>${esc(f.description)}</small><div class="bar"><i style="width:${pct}%"></i></div><small>${f.available?`${left} of ${f.total} slots left`:'No slots left right now'} · up to ${f.maxCars} car${f.maxCars>1?'s':''}</small><div class="pr"><span class="price">${money(f.price)}</span><button class="btn" data-id="${esc(f.id)}"${f.available?'':' disabled'}>Customise</button></div></div></div>`;}).join(''):'<div class="msg">No frames yet.</div>';}
$('#g').onclick=e=>{const b=e.target.closest('[data-id]');if(b&&!b.disabled)openB(b.dataset.id);};
// ---------- builder ----------
function calc(){const f=B.f,l=D.leds.find(x=>x.name===B.led)||{price:0},n=B.cars.filter(c=>c.n.trim()).length,lines=[[f.name,f.price]];if(l.price)lines.push([B.led,l.price]);if(B.text.trim()&&D.textPrice)lines.push(['Custom plaque text',D.textPrice]);if(D.carPrice&&n)lines.push([`${n} car${n>1?'s':''} × ${money(D.carPrice)}`,D.carPrice*n]);return{lines,total:lines.reduce((a,x)=>a+x[1],0)};}
function paint(){$('#bpv').innerHTML=pv(B.f.maxCars,B.bg,ledc(B.led),B.text);const c=calc();$('#bsum').innerHTML=c.lines.map(x=>`<div><span>${esc(x[0])}</span><span>${money(x[1])}</span></div>`).join('')+`<div class="gt"><span>Total (estimate)</span><span>${money(c.total)}</span></div>`;}
function carRows(){$('#bcars').innerHTML=B.cars.map((c,i)=>`<div class="sr"><select data-ci="${i}" data-f="b">${['Hot Wheels','Matchbox','Other brand'].map(x=>`<option${x===c.b?' selected':''}>${x}</option>`).join('')}</select><input data-ci="${i}" data-f="n" value="${esc(c.n)}" maxlength="70" placeholder="Car model, e.g. Nissan Skyline R34">${B.cars.length>1?`<button class="btn alt" data-rm="${i}" aria-label="Remove">×</button>`:''}</div>`).join('')+(B.cars.length<B.f.maxCars?'<button class="btn alt" id="addc">+ Add another car</button>':`<small class="mu">This frame holds up to ${B.f.maxCars} car${B.f.maxCars>1?'s':''}.</small>`);}
const chips=(k,a,v)=>`<div class="chs">${a.map(x=>`<button type="button" class="ch${x===v?' on':''}" data-k="${k}" data-v="${esc(x)}">${k==='bg'?`<i class="sw" style="background:${swatch(x)}"></i>`:''}${esc(x)}</button>`).join('')}</div>`;
function openB(id){const f=D.frames.find(x=>x.id===id);B={f,cars:[{b:'Hot Wheels',n:''}],led:D.leds[0].name,bg:D.bgs[0],text:'',img:'',nm:'',ph:'',notes:''};
  $('#bd').innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>${esc(f.name)}</h2><div id="bpv"></div>
  <div class="og"><label>1. Your cars</label><div id="bcars"></div></div>
  <div class="og"><label>2. LED lighting</label>${chips('led',D.leds.map(x=>x.name),B.led)}</div>
  <div class="og"><label>3. Background colour</label>${chips('bg',D.bgs,B.bg)}</div>
  <div class="og"><label>4. Plaque text (optional)</label><input data-k="text" maxlength="30" placeholder="e.g. Aman's Garage"></div>
  <div class="og"><label>5. Reference image (optional)</label><div id="dz">Tap to upload a photo or design idea (max 5 MB)<input id="fi" type="file" accept="image/*" hidden></div><div id="bup"></div></div>
  <div class="og"><label>Your name</label><input data-k="nm" maxlength="60" autocomplete="name"></div><div class="og"><label>Mobile number</label><input data-k="ph" inputmode="tel" autocomplete="tel" placeholder="10-digit number"></div><div class="og"><label>Notes (optional)</label><input data-k="notes" maxlength="200"></div>
  <div class="tt" id="bsum"></div><div class="er" id="be"></div><button class="btn" id="bsend">Place order</button><small class="mu">Prices are estimates until the shop confirms on WhatsApp. Your slot is reserved when you place the order.</small></div>`;
  carRows();paint();$('#bd').showModal();}
$('#bd').addEventListener('click',e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();if(!B)return;
  const c=t.closest('.ch[data-k]');if(c){B[c.dataset.k]=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));paint();}
  if(t.id==='addc'){B.cars.push({b:'Hot Wheels',n:''});carRows();}const r=t.closest('[data-rm]');if(r){B.cars.splice(+r.dataset.rm,1);carRows();paint();}
  if(t.closest('#dz'))$('#fi').click();if(t.id==='bsend')send(t);});
$('#bd').addEventListener('input',e=>{const t=e.target;if(!B)return;if(t.dataset.ci!==undefined)B.cars[+t.dataset.ci][t.dataset.f]=t.value;else if(t.dataset.k&&!t.classList.contains('ch'))B[t.dataset.k]=t.value;paint();});
$('#bd').addEventListener('change',e=>{if(e.target.id==='fi'&&e.target.files[0])upl(e.target.files[0]);});
function upl(file){const bar=$('#bup');if(!file.type.startsWith('image/')||file.size>5*1024*1024){bar.innerHTML='<span class="er">Images up to 5 MB only.</span>';return;}
  const x=new XMLHttpRequest(),f=new FormData();bar.innerHTML='<div class="bar"><i id="up" style="width:0"></i></div>';x.open('POST',`https://api.cloudinary.com/v1_1/${C.CLOUD_NAME}/image/upload`);
  x.upload.onprogress=e=>{const i=$('#up');if(i)i.style.width=e.loaded/e.total*100+'%';};
  x.onload=()=>{let j={};try{j=JSON.parse(x.responseText);}catch(e){}if(x.status===200){B.img=j.secure_url;bar.innerHTML=`<span class="th"><img src="${esc(img(j.secure_url,160))}" alt=""><button class="btn alt" id="rmi" type="button">Remove</button></span>`;$('#rmi').onclick=()=>{B.img='';bar.innerHTML='';};}else bar.innerHTML='<span class="er">Upload failed. Try again.</span>';};
  x.onerror=()=>bar.innerHTML='<span class="er">Network error.</span>';f.append('file',file);f.append('upload_preset',C.UPLOAD_PRESET);x.send(f);}
async function send(b){const er=$('#be'),ph=B.ph.replace(/\D/g,'').replace(/^0+/,''),cars=B.cars.filter(c=>c.n.trim()).map(c=>c.b+': '+c.n.trim());er.textContent='';
  if(!cars.length)return er.textContent='Please enter at least one car.';if(B.nm.trim().length<2)return er.textContent='Please enter your name.';if(!/^(91)?[6-9]\d{9}$/.test(ph))return er.textContent='Please enter a valid 10-digit mobile number.';
  b.disabled=true;b.textContent='Placing order…';
  try{const r=await post({action:'order',frameId:B.f.id,cars,led:B.led,bg:B.bg,text:B.text,image:B.img,name:B.nm,phone:ph,notes:B.notes});
    $('#bd').innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Order placed</h2><p>Thanks ${esc(B.nm)}! Your slot is reserved and your order is <b>pending</b>. It is confirmed only when the shop replies on WhatsApp.</p><p class="mu">Order ID: <b>${esc(r.orderId)}</b> · Estimated total ${money(r.total)}</p>${r.wa.ok?`<a class="btn wa" target="_blank" rel="noopener" href="${esc(r.wa.url)}">Send order on WhatsApp</a>`:'<p class="er">The shop has not set a WhatsApp number yet. Please contact them directly with your Order ID.</p>'}<small class="mu">Press Send in WhatsApp so the shop receives your order.</small></div>`;B=null;load();}
  catch(x){er.textContent=x.message;b.disabled=false;b.textContent='Place order';}}
load();
