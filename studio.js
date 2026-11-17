const Q=new URLSearchParams(location.search),ADM=Q.get('admin')==='1';let D,ed,TAB='background',O=null;
$('#sn').textContent=C.SHOP_NAME+(ADM?' · Order design':'');if(ADM){$('#bk').href='admin.html';$('#done').hidden=true;$('#hint').textContent='You are viewing the customer\'s saved design. Changes here are not saved.';}
const TABS=[['background','1 Background'],['car','2 Car'],['frame','3 Frame'],['deco','Extras'],['ly','Layers']],LB={background:'background photo',car:'car photo',deco:'picture'};
const SW=[['#111111','Black'],['#f5f5f2','White'],['#b98b5a','Oak'],['#5a3a22','Walnut'],['#c9a24a','Gold'],['#b9bcc2','Silver'],['#b3202a','Red'],['#2f5d9e','Blue']],TH=[['Thin',30],['Medium',50],['Thick',80]];
const HINT={background:'This is the photo that goes inside the frame. The frame fits itself to the shape of your photo.',car:'Your car photo. A PNG with a transparent background looks best. Then drag, rotate and resize it.',deco:'Logos, stickers and other decorations.'};
function toast(m,bad){let t=$('#ts');if(!t){t=document.createElement('div');t.id='ts';document.body.append(t);}(document.querySelector('dialog[open]')||document.body).append(t);t.className=bad?'bad':'';t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,bad?7000:2500);}
function steps(){$('#steps').innerHTML=[['background','Background'],['car','Car'],['frame','Frame colour']].map((s,i)=>{const ok=s[0]==='frame'?true:ed.els.some(x=>x.type===s[0]);return `<span class="st${ok?' ok':''}${TAB===s[0]?' now':''}"><b>${ok?'✓':i+1}</b>${s[1]}</span>`;}).join('');}
function upd(k){const e=ed.get(ed.sel),on=e&&e.type!=='background';$('#tools').classList.toggle('off',!on);if(on){$('#rot').value=Math.round(e.rot);$('#siz').value=Math.round(e.w/ed.W*100);}
  steps();if(k!=='move'&&TAB==='ly')panel();}
$('#rot').oninput=e=>{const x=ed.get(ed.sel);if(x){x.rot=+e.target.value;ed.layout();}};
$('#siz').oninput=e=>{const x=ed.get(ed.sel);if(x){const r=x.h/x.w;x.w=+e.target.value/100*ed.W;x.h=x.w*r;ed.layout();}};
$('#tools').onclick=e=>{const b=e.target.closest('[data-t]'),x=ed.sel;if(!b||!x)return;({fw:()=>ed.move(x,1),bw:()=>ed.move(x,-1),dup:()=>ed.dup(x),del:()=>ed.remove(x)})[b.dataset.t]();};
function panel(){$('#tabs').innerHTML=TABS.map(t=>`<button class="pl${TAB===t[0]?' on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('');const p=$('#panel');steps();
  if(TAB==='frame'){p.innerHTML=`<div class="og"><label>Frame colour</label><div class="sws">${SW.map(([c,n])=>`<button class="swb${ed.frame.color===c?' on':''}" data-c="${c}" style="background:${c}" title="${n}" aria-label="${n}"></button>`).join('')}<label class="swb cu" title="Pick any colour"><input type="color" id="fc" value="${ed.frame.color}"></label></div></div><div class="og"><label>Frame thickness</label>${chips('th',TH.map(([n,v])=>({v:String(v),t:n})),String(ed.frame.t))}</div><small class="mu">You do not need to upload a frame. Ours fits itself around your photo.</small>`;return;}
  if(TAB==='ly'){const l=[...ed.els].reverse();p.innerHTML=`<div class="ly fixed"><span>Frame <small class="mu">always on top</small></span></div>`+(l.length?l.map(e=>`<div class="ly${e.id===ed.sel?' on':''}" data-id="${e.id}"><span>${esc(e.name)} <small class="mu">${e.type==='background'?'Background':e.type==='car'?'Car':'Extra'}</small></span>${e.type==='background'?'':`<span><button class="btn alt" data-m="1" title="Bring forward">▲</button><button class="btn alt" data-m="-1" title="Send back">▼</button><button class="btn red" data-r="1" title="Remove">×</button></span>`}</div>`).join(''):'<p class="mu">Nothing added yet.</p>');return;}
  const a=D.assets.filter(x=>x.type===TAB);p.innerHTML=`<label class="btn up">Upload your ${LB[TAB]}<input id="fi" type="file" accept="image/*" hidden></label><div id="up"></div><small class="mu">${HINT[TAB]}</small>${a.length?`<div class="og"><label>Or choose from our library</label><div class="ag">${a.map(x=>`<button data-a="${esc(x.id)}" title="${esc(x.name)}"><img loading="lazy" src="${esc(thumb(x.url,200))}" alt="${esc(x.name)}"></button>`).join('')}</div></div>`:''}`;}
$('#tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b){TAB=b.dataset.tab;panel();}};
async function addEl(type,url,name){await ed.add(type,url,name);if(type==='background'&&!ed.els.some(x=>x.type==='car')){TAB='car';panel();}}
$('#panel').onclick=async e=>{const t=e.target,a=t.closest('[data-a]');
  if(a){const x=D.assets.find(y=>y.id===a.dataset.a);try{await addEl(x.type,x.url,x.name);}catch(err){toast(err.message,1);}return;}
  const sw=t.closest('[data-c]');if(sw){ed.setFrame({color:sw.dataset.c});panel();return;}
  const c=t.closest('.ch[data-k="th"]');if(c){ed.setFrame({t:+c.dataset.v});panel();return;}
  const row=t.closest('.ly[data-id]');if(!row)return;const id=row.dataset.id;if(t.dataset.m)ed.move(id,+t.dataset.m);else if(t.dataset.r)ed.remove(id);else ed.select(id);};
$('#panel').oninput=e=>{if(e.target.id==='fc')ed.setFrame({color:e.target.value});};
$('#panel').onchange=async e=>{if(e.target.id!=='fi'||!e.target.files[0])return;const f=e.target.files[0],box=$('#up');
  if(!f.type.startsWith('image/')||f.size>12*1024*1024){box.innerHTML='<span class="er">Images up to 12 MB only.</span>';return;}
  box.innerHTML='<div class="bar2"><i id="ub" style="width:0"></i></div><small class="mu">Uploading…</small>';
  try{const url=await upload(f,p=>{const i=$('#ub');if(i)i.style.width=p*100+'%';});await addEl(TAB,url,f.name.replace(/\.\w+$/,'').slice(0,30));const b2=$('#up');if(b2)b2.innerHTML='<span class="mu">Added ✓</span>';}catch(err){const b2=$('#up');if(b2)b2.innerHTML=`<span class="er">${esc(err.message)}</span>`;}};
// ---------- order ----------
const total=()=>{const f=D.frames.find(x=>x.id===O.f)||{price:0},l=D.leds.find(x=>x.name===O.led)||{price:0};return f.price+l.price;};
$('#done').onclick=async()=>{if(!ed.els.length)return toast('Add a background photo and a car first.',1);if(!ed.els.some(x=>x.type==='background'))return toast('Please add a background photo first.',1);const d=$('#od');ed.select(null);
  d.innerHTML='<div class="dp"><div class="sk" style="height:260px"></div><small class="mu">Preparing your preview…</small></div>';d.showModal();let blob;
  try{blob=await ed.export(.6);}catch(err){d.close();return toast('Could not build the preview: '+err.message,1);}
  const fr=D.frames,first=fr.find(f=>f.available);O={f:first?first.id:'',led:D.leds[0].name};
  d.innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Your design</h2><img class="pimg" src="${URL.createObjectURL(blob)}" alt="Your design"><div class="og"><label>Frame size</label>${chips('f',fr.map(f=>({v:f.id,t:`${f.name} · ${money(f.price)}${f.available?'':' (sold out)'}`,off:!f.available})),O.f)}</div>
  <div class="og"><label>LED lighting</label>${chips('led',D.leds.map(l=>({v:l.name,t:l.price?`${l.name} (+${money(l.price)})`:l.name})),O.led)}</div>${contact()}<div class="tt"><div class="gt"><span>Total</span><span id="rt">${money(total())}</span></div></div>
  <div class="er" id="be"></div><div class="ft"><button class="btn" id="bsend">Place order</button></div><small class="mu">No online payment: after ordering you get UPI / WhatsApp details to pay the shop directly. Your final design image is sent to the shop.</small></div>`;};
$('#od').addEventListener('click',async e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();if(!O)return;
  const c=t.closest('.ch[data-k]');if(c){O[c.dataset.k]=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));if($('#rt'))$('#rt').textContent=money(total());}
  if(t.id!=='bsend')return;const er=$('#be');er.textContent='';const ct=readC(),m=checkC(ct);if(!O.f)return er.textContent='All frame sizes are sold out right now.';if(m)return er.textContent=m;t.disabled=true;
  try{t.textContent='Creating high-quality image…';const blob=await ed.export('auto');t.textContent='Uploading design…';const url=await upload(blob);t.textContent='Placing order…';
    const r=await post({action:'order',kind:'custom',frameId:O.f,led:O.led,json:JSON.stringify(ed.toJSON()),image:url,...ct});d.innerHTML=payHtml(r,ct.name);O=null;}
  catch(x){er.textContent=x.message;t.disabled=false;t.textContent='Place order';}});
(async()=>{try{D=await get();}catch(e){$('#stage').outerHTML='<div class="msg">Could not load the library. Please refresh.</div>';return;}
  ed=new Editor($('#stage'),{onChange:upd});panel();
  if(ADM){try{if(!tok()){toast('Log in on the admin page first.',1);return;}const r=await post({action:'orderDesign',id:Q.get('order')});if(r.json)ed.load(JSON.parse(r.json));}catch(e){toast(e.message,1);}}})();
