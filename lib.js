const C=CONFIG,$=s=>document.querySelector(s),tok=()=>sessionStorage.tok,OKURL=/^https:\/\/res\.cloudinary\.com\//;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>C.CURRENCY+Number(n).toLocaleString('en-IN');
const thumb=(u,w)=>u.replace('/upload/','/upload/f_auto,q_auto,w_'+w+'/'),big=u=>u.replace('/upload/','/upload/q_auto,w_2400,c_limit/');
async function get(q=''){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(C.API_URL+'?'+q+'&_='+Date.now(),{signal:ctl.signal}),j=await r.json();if(!j.ok)throw new Error(j.error||'Request failed');return j.data;}finally{clearTimeout(tm);}}
async function post(body){const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({token:tok(),...body})}),j=await r.json();
  if(j.auth===false){sessionStorage.removeItem('tok');location.href='admin.html';throw new Error(j.error);}if(!j.ok)throw new Error(j.error);return j.data;}
// Direct browser upload to Cloudinary (unsigned preset). Accepts a File or Blob.
function upload(file,onP){return new Promise((res,rej)=>{const x=new XMLHttpRequest(),f=new FormData();x.open('POST',`https://api.cloudinary.com/v1_1/${C.CLOUD_NAME}/image/upload`);
  x.upload.onprogress=e=>onP&&e.lengthComputable&&onP(e.loaded/e.total);x.onload=()=>{let j={};try{j=JSON.parse(x.responseText);}catch(e){}x.status===200?res(j.secure_url):rej(new Error((j.error&&j.error.message)||'Upload failed'));};
  x.onerror=()=>rej(new Error('Network error'));f.append('file',file);f.append('upload_preset',C.UPLOAD_PRESET);x.send(f);});}
const loadImg=u=>new Promise((res,rej)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not load an image'));i.src=u;});
// ---------- shared checkout pieces ----------
const chips=(k,a,cur)=>`<div class="chs">${a.map(x=>`<button type="button" class="ch${x.v===cur?' on':''}" data-k="${k}" data-v="${esc(x.v)}"${x.off?' disabled':''}>${esc(x.t)}</button>`).join('')}</div>`;
const field=(id,l,a='')=>`<div class="og"><label>${l}</label><input id="${id}" ${a}></div>`;
const contact=()=>field('cn','Your name','maxlength="60" autocomplete="name"')+field('cp','Mobile number','inputmode="tel" autocomplete="tel" placeholder="10-digit number"')+'<div class="og"><label>Delivery address</label><textarea id="ca" rows="3" maxlength="300" placeholder="House no, street, area, city, PIN code"></textarea></div>'+field('cx','Notes (optional)','maxlength="200"');
const readC=()=>({name:$('#cn').value.trim(),phone:$('#cp').value.replace(/\D/g,'').replace(/^0+/,''),address:$('#ca').value.trim(),notes:$('#cx').value.trim()});
const checkC=c=>c.name.length<2?'Please enter your name.':!/^(91)?[6-9]\d{9}$/.test(c.phone)?'Please enter a valid 10-digit mobile number.':c.address.length<10?'Please enter your full delivery address.':'';
const payHtml=(r,nm)=>`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Order placed</h2><p>Thanks ${esc(nm)}! Your order <b>${esc(r.orderId)}</b> is saved as <b>pending</b>. Total <b>${money(r.total)}</b>.</p>
<div class="note"><b>How to pay</b><p>${esc(r.pay.note)}</p>${r.pay.upi?`<a class="btn alt" href="${esc(r.pay.upi)}">Pay with UPI app</a>`:''}</div>
${r.wa.ok?`<a class="btn wa" target="_blank" rel="noopener" href="${esc(r.wa.url)}">Send order on WhatsApp</a>`:'<p class="er">The shop has not set a WhatsApp number yet. Please contact them with your Order ID.</p>'}<small class="mu">Press Send in WhatsApp so the shop receives your design and address. Your order is confirmed only after the shop replies and your payment is received.</small></div>`;
// ---------- layered design editor (built-in frame that fits the background photo) ----------
class Editor{
  constructor(stage,o={}){this.W=900;this.H=1200;this.st=stage;this.els=[];this.sel=null;this.nodes={};this.imgs={};this.frame={color:'#111111',t:50};this.cb=o.onChange||(()=>{});stage.classList.add('stg');
    if(window.ResizeObserver)new ResizeObserver(()=>this.layout()).observe(stage);window.addEventListener('resize',()=>this.fit());
    stage.addEventListener('pointerdown',e=>{if(!e.target.closest('.el:not(.bg)'))this.select(null);});this.fit();}
  sc(){return(this.st.clientWidth||this.W)/this.W;}
  get(id){return this.els.find(e=>e.id===id);}
  // size the stage on screen so the whole canvas is always visible
  fit(){const p=this.st.parentElement,aw=Math.min((p&&p.clientWidth)||560,620),ah=Math.max(320,(window.innerHeight||800)*.68),k=Math.min(aw/this.W,ah/this.H);this.st.style.width=Math.round(this.W*k)+'px';this.st.style.height=Math.round(this.H*k)+'px';this.layout();}
  // canvas shape follows the background photo (kept between 0.6 and 1.6 so the frame stays sensible)
  setRatio(r){r=Math.max(.6,Math.min(1.6,r||.75));const H=Math.round(this.W/r),k=H/this.H;this.els.forEach(e=>{e.y*=k;});this.H=H;const b=this.els.find(e=>e.type==='background');if(b){b.h=H;b.y=H/2;}this.fit();}
  setFrame(f){this.frame={...this.frame,...f};this.layout();this.cb('change');}
  render(){this.st.innerHTML='';this.nodes={};this.els.forEach(e=>{const n=document.createElement('div'),i=document.createElement('img');n.className='el'+(e.type==='background'?' bg':'');i.src=big(e.url);i.alt='';i.draggable=false;n.append(i);
      if(e.type!=='background')n.addEventListener('pointerdown',ev=>this.down(ev,e));this.st.append(n);this.nodes[e.id]=n;});
    this.fr=document.createElement('div');this.fr.className='fr';this.st.append(this.fr);this.layout();this.handles();}
  layout(){const s=this.sc();this.els.forEach((e,i)=>{const n=this.nodes[e.id];if(!n)return;const t=n.style;t.width=e.w*s+'px';t.height=e.h*s+'px';t.left=(e.x-e.w/2)*s+'px';t.top=(e.y-e.h/2)*s+'px';t.transform=`rotate(${e.rot}deg)`;t.zIndex=i+1;});
    if(this.fr){const f=this.fr.style;f.borderStyle='solid';f.borderWidth=this.frame.t*s+'px';f.borderColor=this.frame.color;f.boxShadow=`inset 0 0 ${30*s}px rgba(0,0,0,.65), inset 0 0 0 ${Math.max(1,2*s)}px rgba(0,0,0,.4)`;}}
  handles(){this.st.querySelectorAll('.hn').forEach(h=>h.remove());this.st.querySelectorAll('.el.on').forEach(n=>n.classList.remove('on'));const e=this.get(this.sel);if(!e||e.type==='background')return;
    const n=this.nodes[e.id],rs=document.createElement('i'),ro=document.createElement('i');n.classList.add('on');rs.className='hn rs';ro.className='hn ro';n.append(rs,ro);rs.addEventListener('pointerdown',v=>this.hdl(v,e,'rs'));ro.addEventListener('pointerdown',v=>this.hdl(v,e,'ro'));}
  select(id){this.sel=id;this.handles();this.cb('select');}
  down(ev,e){ev.preventDefault();if(this.sel!==e.id)this.select(e.id);const n=this.nodes[e.id],s=this.sc(),x0=ev.clientX,y0=ev.clientY,ex=e.x,ey=e.y;try{n.setPointerCapture(ev.pointerId);}catch(x){}
    const mv=m=>{e.x=Math.max(0,Math.min(this.W,ex+(m.clientX-x0)/s));e.y=Math.max(0,Math.min(this.H,ey+(m.clientY-y0)/s));this.layout();},up=()=>{n.removeEventListener('pointermove',mv);n.removeEventListener('pointerup',up);n.removeEventListener('pointercancel',up);this.cb('change');};
    n.addEventListener('pointermove',mv);n.addEventListener('pointerup',up);n.addEventListener('pointercancel',up);}
  hdl(ev,e,k){ev.preventDefault();ev.stopPropagation();const h=ev.currentTarget,s=this.sc(),r=this.st.getBoundingClientRect(),cx=r.left+e.x*s,cy=r.top+e.y*s,d0=Math.hypot(ev.clientX-cx,ev.clientY-cy)||1,w0=e.w,h0=e.h;try{h.setPointerCapture(ev.pointerId);}catch(x){}
    const mv=m=>{if(k==='rs'){const w=Math.max(30,Math.min(this.W*2,w0*Math.hypot(m.clientX-cx,m.clientY-cy)/d0));e.w=w;e.h=h0*w/w0;}else{let a=Math.atan2(m.clientY-cy,m.clientX-cx)*180/Math.PI+90;a=((a+540)%360)-180;const q=Math.round(a/90)*90;if(Math.abs(a-q)<3)a=q;e.rot=Math.round(a*10)/10;}this.layout();this.cb('move');},
    up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);this.cb('change');};h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);}
  async add(type,url,name){const im=await loadImg(big(url));this.imgs[url]=im;const r=im.naturalWidth/im.naturalHeight;let w,h;
    if(type==='background'){this.setRatio(r);w=this.W;h=this.H;this.els=this.els.filter(x=>x.type!=='background');}
    else{const inner=this.W-2*this.frame.t;w=type==='car'?inner*.6:inner*.3;h=w/r;if(h>this.H*.8){h=this.H*.8;w=h*r;}}
    const e={id:'e'+Math.random().toString(36).slice(2,8),type,url,x:this.W/2,y:this.H/2,w,h,rot:0,name:name||type};if(type==='background')this.els.unshift(e);else this.els.push(e);
    this.sel=type==='background'?null:e.id;this.render();this.cb('change');return e;}
  remove(id){this.els=this.els.filter(e=>e.id!==id);if(this.sel===id)this.sel=null;this.render();this.cb('change');}
  move(id,d){const i=this.els.findIndex(e=>e.id===id),j=i+d,lo=this.els[0]&&this.els[0].type==='background'?1:0;if(i<lo||j<lo||j>=this.els.length)return;[this.els[i],this.els[j]]=[this.els[j],this.els[i]];this.render();this.cb('change');}
  dup(id){const e=this.get(id);if(!e)return;const c={...e,id:'e'+Math.random().toString(36).slice(2,8),x:Math.min(this.W,e.x+40),y:Math.min(this.H,e.y+40)};this.els.push(c);this.sel=c.id;this.render();this.cb('change');}
  toJSON(){return{v:2,w:this.W,h:this.H,frame:{...this.frame},els:this.els.map(e=>({id:e.id,type:e.type,url:e.url,x:e.x,y:e.y,w:e.w,h:e.h,rot:e.rot,name:e.name}))};}
  load(j){this.H=Math.max(540,Math.min(1500,Math.round(+j.h||1200)));this.frame=j.frame&&/^#[0-9a-f]{6}$/i.test(j.frame.color)?{color:j.frame.color,t:+j.frame.t||50}:{color:'#111111',t:0};
    this.els=(j.els||[]).filter(e=>OKURL.test(String(e.url))).map(e=>({id:String(e.id),type:e.type,url:e.url,x:+e.x,y:+e.y,w:+e.w,h:+e.h,rot:+e.rot||0,name:e.name||e.type}));this.sel=null;this.render();this.fit();this.cb('change');}
  // Draws every layer, then the frame, and returns a JPEG. scale 'auto' picks the resolution from the background photo (max ~8 megapixels).
  async export(scale=2,type='image/jpeg',q=.92){for(const e of this.els)this.imgs[e.url]=this.imgs[e.url]||await loadImg(big(e.url));
    const bg=this.els.find(e=>e.type==='background');if(scale==='auto')scale=Math.max(1.5,Math.min(2.67,(bg?this.imgs[bg.url].naturalWidth:1800)/this.W));scale=Math.min(scale,Math.sqrt(8e6/(this.W*this.H)));
    const c=document.createElement('canvas');c.width=Math.round(this.W*scale);c.height=Math.round(this.H*scale);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
    for(const e of this.els){const im=this.imgs[e.url],w=e.w*scale,h=e.h*scale;g.save();g.translate(e.x*scale,e.y*scale);g.rotate(e.rot*Math.PI/180);
      if(e.type==='background'){const iw=im.naturalWidth,ih=im.naturalHeight,cr=w/h;let sw=iw,sh=ih,sx=0,sy=0;if(iw/ih>cr){sw=ih*cr;sx=(iw-sw)/2;}else{sh=iw/cr;sy=(ih-sh)/2;}g.drawImage(im,sx,sy,sw,sh,-w/2,-h/2,w,h);}else g.drawImage(im,-w/2,-h/2,w,h);g.restore();}
    const t=this.frame.t*scale,W=c.width,H=c.height;if(t>0){g.save();g.beginPath();g.rect(0,0,W,H);g.rect(t,t,W-2*t,H-2*t);g.shadowColor='rgba(0,0,0,.65)';g.shadowBlur=30*scale;g.fillStyle=this.frame.color;g.fill('evenodd');g.restore();
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=Math.max(1,2*scale);g.strokeRect(t,t,W-2*t,H-2*t);}
    return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not create the image')),type,q));}
}
