const Q=new URLSearchParams(location.search),ADM=Q.get('admin')==='1';let D,ed,TAB='frame',UT='car',O=null,editing=null;
$('#sn').textContent=C.SHOP_NAME+(ADM?' · Admin design':'');if(ADM)$('#bk').href='admin.html';$('#done').textContent=ADM?'Save as ready-made design':'Preview & order';
const TABS=[['frame','Frames'],['background','Backgrounds'],['car','Cars'],['deco','Extras'],['up','Upload'],['ly','Layers']],TN={frame:'Frame',background:'Background',car:'Car',deco:'Other'};
function toast(m,bad){let t=$('#ts');if(!t){t=document.createElement('div');t.id='ts';document.body.append(t);}(document.querySelector('dialog[open]')||document.body).append(t);t.className=bad?'bad':'';t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,bad?7000:2500);}
function upd(k){const e=ed.get(ed.sel),on=e&&e.type!=='background';$('#tools').classList.toggle('off',!on);if(on){$('#rot').value=Math.round(e.rot);$('#siz').value=Math.round(e.w/ed.W*100);}if(k!=='move'&&TAB==='ly')panel();}
$('#rot').oninput=e=>{const x=ed.get(ed.sel);if(x){x.rot=+e.target.value;ed.layout();}};
$('#siz').oninput=e=>{const x=ed.get(ed.sel);if(x){const r=x.h/x.w;x.w=+e.target.value/100*ed.W;x.h=x.w*r;ed.layout();}};
$('#tools').onclick=e=>{const b=e.target.closest('[data-t]'),x=ed.sel;if(!b||!x)return;({fw:()=>ed.move(x,1),bw:()=>ed.move(x,-1),dup:()=>ed.dup(x),del:()=>ed.remove(x)})[b.dataset.t]();};
function panel(){$('#tabs').innerHTML=TABS.map(t=>`<button class="pl${TAB===t[0]?' on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('');const p=$('#panel');
  if(TAB==='up'){p.innerHTML=`<div class="og"><label>What are you uploading?</label>${chips('ut',Object.entries(TN).map(([v,t])=>({v,t})),UT)}</div><div id="dz">Tap to choose an image (PNG with transparent background works best, max 8 MB)<input id="fi" type="file" accept="image/*" hidden></div><div id="up"></div><small class="mu">Your uploads are used only in your design. Mix and match them with library items.</small>`;return;}
  if(TAB==='ly'){const l=[...ed.els].reverse();p.innerHTML=l.length?l.map(e=>`<div class="ly${e.id===ed.sel?' on':''}" data-id="${e.id}"><span>${esc(e.name)} <small class="mu">${TN[e.type]}</small></span>${e.type==='background'?'':`<span><button class="btn alt" data-m="1">▲</button><button class="btn alt" data-m="-1">▼</button><button class="btn red" data-r="1">×</button></span>`}</div>`).join(''):'<p class="mu">Nothing added yet.</p>';return;}
  const a=D.assets.filter(x=>x.type===TAB);p.innerHTML=a.length?`<div class="ag">${a.map(x=>`<button data-a="${esc(x.id)}" title="${esc(x.name)}"><img loading="lazy" src="${esc(thumb(x.url,200))}" alt="${esc(x.name)}"></button>`).join('')}</div>`:`<p class="mu">No ${TN[TAB].toLowerCase()}s in the library yet. You can upload your own in the Upload tab.</p>`;}
$('#tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b){TAB=b.dataset.tab;panel();}};
$('#panel').onclick=async e=>{const t=e.target,a=t.closest('[data-a]');
  if(a){const x=D.assets.find(y=>y.id===a.dataset.a);try{await ed.add(x.type,x.url,x.name);}catch(err){toast(err.message,1);}return;}
  const c=t.closest('.ch[data-k]');if(c){UT=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(y=>y.classList.toggle('on',y===c));}
  if(t.closest('#dz'))$('#fi').click();const row=t.closest('.ly');if(!row)return;const id=row.dataset.id;
  if(t.dataset.m)ed.move(id,+t.dataset.m);else if(t.dataset.r)ed.remove(id);else ed.select(id);};
$('#panel').onchange=async e=>{if(e.target.id!=='fi'||!e.target.files[0])return;const f=e.target.files[0],box=$('#up');
  if(!f.type.startsWith('image/')||f.size>8*1024*1024){box.innerHTML='<span class="er">Images up to 8 MB only.</span>';return;}
  box.innerHTML='<div class="bar2"><i id="ub" style="width:0"></i></div><small class="mu">Uploading…</small>';
  try{const url=await upload(f,p=>{const i=$('#ub');if(i)i.style.width=p*100+'%';});await ed.add(UT,url,f.name.replace(/\.\w+$/,'').slice(0,30));box.innerHTML='<span class="mu">Added to your design.</span>';}catch(err){box.innerHTML=`<span class="er">${esc(err.message)}</span>`;}};
// ---------- finish: customer order or admin save ----------
const total=()=>{const f=D.frames.find(x=>x.id===O.f)||{price:0},l=D.leds.find(x=>x.name===O.led)||{price:0};return f.price+l.price;};
$('#done').onclick=async()=>{if(!ed.els.length)return toast('Add at least one frame, background or car first.',1);const d=$('#od');ed.select(null);
  d.innerHTML='<div class="dp"><div class="sk" style="height:260px"></div><small class="mu">Preparing your preview…</small></div>';d.showModal();let blob;
  try{blob=await ed.export(.6);}catch(err){d.close();return toast('Could not build the preview: '+err.message,1);}
  const pv=`<img class="pimg" src="${URL.createObjectURL(blob)}" alt="Your design">`;
  if(ADM){O={};d.innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Save design</h2>${pv}${field('dn','Design name','maxlength="80"')}${field('dp','Price (all-in)','type="number" min="0"')}<div class="og"><label>Made on frame size</label><select id="df">${D.frames.map(f=>`<option value="${esc(f.id)}">${esc(f.name)} (${money(f.price)})</option>`).join('')}</select></div>${field('dd','Description','maxlength="300"')}<label class="ck"><input type="checkbox" id="da" checked> Show to customers</label><div class="er" id="be"></div><button class="btn" id="bsend">Save design</button></div>`;
    if(editing){$('#dn').value=editing.name;$('#dp').value=editing.price;$('#df').value=editing.frameId;$('#dd').value=editing.description;$('#da').checked=editing.active;}return;}
  const fr=D.frames,first=fr.find(f=>f.available);O={f:first?first.id:'',led:D.leds[0].name};
  d.innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Your design</h2>${pv}<div class="og"><label>Frame size</label>${chips('f',fr.map(f=>({v:f.id,t:`${f.name} · ${money(f.price)}${f.available?'':' (sold out)'}`,off:!f.available})),O.f)}</div>
  <div class="og"><label>LED lighting</label>${chips('led',D.leds.map(l=>({v:l.name,t:l.price?`${l.name} (+${money(l.price)})`:l.name})),O.led)}</div>${contact()}<div class="tt"><div class="gt"><span>Total</span><span id="rt">${money(total())}</span></div></div>
  <div class="er" id="be"></div><button class="btn" id="bsend">Place order</button><small class="mu" id="st">No online payment: after ordering you get UPI / WhatsApp details to pay the shop directly. Your final design image and settings are sent to the shop.</small></div>`;};
$('#od').addEventListener('click',async e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();if(!O)return;
  const c=t.closest('.ch[data-k]');if(c){O[c.dataset.k]=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));if($('#rt'))$('#rt').textContent=money(total());}
  if(t.id!=='bsend')return;const er=$('#be');er.textContent='';
  if(ADM){const nm=$('#dn').value.trim();if(nm.length<2)return er.textContent='Please enter a design name.';t.disabled=true;t.textContent='Saving…';
    try{const url=await upload(await ed.export(1));await post({action:'saveDesign',id:editing?editing.id:'',name:nm,price:$('#dp').value,frameId:$('#df').value,description:$('#dd').value,active:$('#da').checked,image:url,json:JSON.stringify(ed.toJSON())});d.innerHTML='<button class="x" data-x>×</button><div class="dp"><h2>Design saved</h2><p>It is now in your ready-made designs.</p><a class="btn" href="admin.html">Back to admin</a></div>';O=null;}catch(x){er.textContent=x.message;t.disabled=false;t.textContent='Save design';}return;}
  const ct=readC(),m=checkC(ct);if(!O.f)return er.textContent='All frame sizes are sold out right now.';if(m)return er.textContent=m;t.disabled=true;
  try{t.textContent='Creating high-quality image…';const blob=await ed.export(2);t.textContent='Uploading design…';const url=await upload(blob);t.textContent='Placing order…';
    const r=await post({action:'order',kind:'custom',frameId:O.f,led:O.led,json:JSON.stringify(ed.toJSON()),image:url,...ct});d.innerHTML=payHtml(r,ct.name);O=null;}
  catch(x){er.textContent=x.message;t.disabled=false;t.textContent='Place order';}});
(async()=>{try{D=await get();}catch(e){$('#stage').outerHTML='<div class="msg">Could not load the library. Please refresh.</div>';return;}
  ed=new Editor($('#stage'),{onChange:upd});panel();upd();
  try{if(Q.get('design')){const d=await get('design='+encodeURIComponent(Q.get('design')));ed.load(JSON.parse(d.json));}
    if(ADM){if(!tok()){toast('Log in on the admin page first.',1);return;}
      if(Q.get('edit')){const l=await post({action:'designs'});editing=l.find(x=>x.id===Q.get('edit'));if(editing)ed.load(JSON.parse(editing.json));}
      if(Q.get('order')){const r=await post({action:'orderDesign',id:Q.get('order')});if(r.json)ed.load(JSON.parse(r.json));}}}catch(e){toast(e.message,1);}})();
