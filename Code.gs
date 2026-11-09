// Frame Garage backend: Google Sheet as database, deployed as a Web App (Execute as: Me, Access: Anyone).
// CORS: Apps Script cannot set response headers. The frontend therefore sends every POST as text/plain
// (a "simple request", so the browser sends no preflight) and reads e.postData.contents here. Google serves
// web-app responses with Access-Control-Allow-Origin: *, so fetch() from GitHub Pages works.
const FH=['Frame_ID','Frame_Name','Total_Slots','Booked_Slots','Is_Available','Price','Image_URL','Description','Max_Cars'];
const OH=['Order_ID','Timestamp','Customer_Name','Phone','Frame_Style','Selected_Cars','LED_Option','Custom_Text','Uploaded_Image_URL','Total_Price','Status','Frame_ID','Background','Notes'];
const ST=['Pending','Confirmed','Completed','Cancelled'];
const SDEF={SHOP_NAME:'Frame Garage',WHATSAPP:'91XXXXXXXXXX',CAR_PRICE:'0',TEXT_PRICE:'150',LED_OPTIONS:'No LED:0,Warm white LED:400,Cool white LED:400,RGB LED:700',BACKGROUNDS:'Matte black,Garage grey,Racing red,Sunset orange,Sky blue'};
const cache=()=>CacheService.getScriptCache(), now=()=>Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm:ss');
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const u=x=>typeof x==='string'?x.replace(/^'(?=[=+\-@])/,''):x;
function t(v,max){v=String(v==null?'':v).replace(/[<>]/g,'').trim().slice(0,max||200);return /^[=+\-@]/.test(v)?"'"+v:v;}
const num=v=>{const n=Number(v);return isFinite(n)&&n>=0?n:0;};

function book(){const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID'),s=id?SpreadsheetApp.openById(id.trim()):SpreadsheetApp.getActive(); if(!s) throw new Error('Script is not linked to a Sheet. Add SHEET_ID in Script Properties.'); return s;}
function tab(name,head,fmt){const b=book();let s=b.getSheetByName(name);if(!s){s=b.insertSheet(name);s.getRange(1,1,1,head.length).setValues([head]).setFontWeight('bold');s.setFrozenRows(1);(fmt||[]).forEach(r=>s.getRange(r).setNumberFormat('@'));}return s;}
const fsh=()=>tab('Slots_Availability',FH), osh=()=>tab('Orders',OH,['A:B','D:D']), ssh=()=>tab('Settings',['Setting','Value'],['B:B']);
function rows(s){const v=s.getDataRange().getValues(),h=v.shift()||[];const r=[];v.forEach((x,i)=>{if(String(x[0])==='')return;const o={_r:i+2};h.forEach((k,j)=>o[k]=x[j]);r.push(o);});return r;}

function setup(){
  osh(); settings();
  const s=fsh(); if(s.getLastRow()>1) return 'Already set up.';
  [['F1','Single Car Classic',10,1499,'Black shadowbox for one 1:64 car with acrylic cover.',1],['F2','Duo Display',8,2299,'Two cars side by side.',2],['F3','Grid of 4',5,3999,'Four-car wall frame.',4],['F4','Mega 6 Wall Frame',3,5499,'Six cars, the full collection.',6]]
   .forEach(f=>s.appendRow([f[0],f[1],f[2],0,true,f[3],'',f[4],f[5]]));
  return 'Setup done.';
}
function settings(){
  const s=ssh(); if(s.getLastRow()<2){const r=Object.keys(SDEF).map(k=>[k,SDEF[k]]);s.getRange(2,1,r.length,2).setValues(r);}
  const o=Object.assign({},SDEF); rows(s).forEach(r=>{const v=String(r.Value).trim(); if(v) o[String(r.Setting).trim()]=v;});
  o.leds=o.LED_OPTIONS.split(',').map(x=>{const a=x.split(':');return {name:a[0].trim(),price:num(a[1])};}).filter(x=>x.name);
  o.bgs=o.BACKGROUNDS.split(',').map(x=>x.trim()).filter(Boolean); return o;
}
function frames(){return rows(fsh()).map(r=>{const tot=Math.floor(num(r.Total_Slots)),bk=Math.floor(num(r.Booked_Slots));
  return {_r:r._r,id:String(r.Frame_ID),name:u(String(r.Frame_Name)),total:tot,booked:bk,available:tot>bk,price:num(r.Price),image:String(r.Image_URL||''),description:u(String(r.Description||'')),maxCars:Math.max(1,Math.floor(num(r.Max_Cars))||1)};});}
function orders(){return rows(osh()).map(r=>({_r:r._r,id:String(r.Order_ID),time:String(r.Timestamp),name:u(String(r.Customer_Name)),phone:String(r.Phone),frame:u(String(r.Frame_Style)),cars:u(String(r.Selected_Cars)),led:u(String(r.LED_Option)),text:u(String(r.Custom_Text)),image:String(r.Uploaded_Image_URL||''),total:num(r.Total_Price),status:String(r.Status),frameId:String(r.Frame_ID),bg:u(String(r.Background)),notes:u(String(r.Notes))}));}

// ---------- GET: real-time frames + availability ----------
function doGet(e){
  try{
    const c=cache(),h=c.get('pub'); if(h) return out(JSON.parse(h));
    const S=settings(), r={ok:true,data:{shop:S.SHOP_NAME,whatsapp:S.WHATSAPP,textPrice:num(S.TEXT_PRICE),carPrice:num(S.CAR_PRICE),leds:S.leds,bgs:S.bgs,
      frames:frames().map(f=>({id:f.id,name:f.name,total:f.total,booked:f.booked,available:f.available,price:f.price,image:f.image,description:f.description,maxCars:f.maxCars}))}};
    try{c.put('pub',JSON.stringify(r),20);}catch(x){} return out(r);
  }catch(err){return out({ok:false,error:String(err.message||err)});}
}

// ---------- POST ----------
function login(pw){
  const c=cache(); if(Number(c.get('fails')||0)>=5) return {ok:false,error:'Too many attempts. Try again in 10 minutes.'};
  if(pw&&pw===PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')){c.remove('fails');const tk=Utilities.getUuid()+Utilities.getUuid();c.put('t_'+tk,'1',21600);return {ok:true,token:tk};}
  c.put('fails',String(Number(c.get('fails')||0)+1),600); return {ok:false,error:'Wrong password'};
}
function doPost(e){
  try{
    const b=JSON.parse(e.postData.contents), c=cache();
    if(b.action==='login') return out(login(b.password));
    if(b.action!=='order'&&(!b.token||!c.get('t_'+b.token))) return out({ok:false,auth:false,error:'Session expired, please log in again.'});
    if(b.action==='orders') return out({ok:true,data:orders().reverse()});
    const A={order,setOrder,saveFrame,deleteFrame}; if(!A[b.action]) throw new Error('Unknown action');
    const lk=LockService.getScriptLock(); lk.waitLock(20000);
    try{const d=A[b.action](b); c.remove('pub'); return out({ok:true,data:d});}finally{lk.releaseLock();}
  }catch(err){return out({ok:false,error:String(err.message||err)});}
}
function adj(id,d){const f=frames().find(x=>x.id===id); if(!f) return; const bk=Math.max(0,f.booked+d);
  if(d>0&&bk>f.total) throw new Error('No slots left for this frame.'); fsh().getRange(f._r,4,1,2).setValues([[bk,f.total>bk]]);}

function order(b){
  const S=settings(), f=frames().find(x=>x.id===String(b.frameId)); if(!f) throw new Error('Frame not found.');
  if(!f.available) throw new Error('Sorry, this frame has no slots left.');
  const nm=t(b.name,60), ph=String(b.phone||'').replace(/\D/g,'').replace(/^0+/,'');
  if(nm.replace(/^'/,'').length<2) throw new Error('Please enter your name.');
  if(!/^(91)?[6-9]\d{9}$/.test(ph)) throw new Error('Please enter a valid 10-digit mobile number.');
  const cars=(Array.isArray(b.cars)?b.cars:[]).map(x=>t(x,90)).filter(x=>x.replace(/^'/,'')); if(!cars.length) throw new Error('Please add at least one car.'); if(cars.length>f.maxCars) throw new Error('This frame holds up to '+f.maxCars+' cars.');
  const led=S.leds.find(x=>x.name===b.led)||S.leds[0], bg=S.bgs.indexOf(b.bg)>=0?b.bg:S.bgs[0], text=t(b.text,30), img=String(b.image||'');
  if(img&&!/^https:\/\/res\.cloudinary\.com\//.test(img)) throw new Error('Invalid image link.');
  const k='o_'+ph.slice(-10), n=+(cache().get(k)||0); if(n>=3) throw new Error('Too many orders from this number. Please contact the shop on WhatsApp.');
  const total=f.price+led.price+(text?num(S.TEXT_PRICE):0)+cars.length*num(S.CAR_PRICE);
  const id='FG'+Date.now().toString(36).slice(-5).toUpperCase()+Math.floor(Math.random()*90+10);
  osh().appendRow([id,now(),nm,ph.slice(-10),f.name,cars.join('; '),led.name,text,img,total,'Pending',f.id,bg,t(b.notes,300)]);
  adj(f.id,1); cache().put(k,String(n+1),3600);
  const msg=['Hello! I would like to order a custom shadowbox frame:','','Order: '+id,'Frame: '+f.name,'Cars: '+cars.join('; '),'LED: '+led.name,'Background: '+bg,text?'Plaque text: '+text:'',img?'Reference image: '+img:'','Total: ₹'+total+' (final price confirmed on WhatsApp)','Name: '+nm,'','Please confirm my order.'].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n').replace(/\n'/g,'\n');
  const num0=String(S.WHATSAPP).replace(/\D/g,'');
  return {orderId:id,total,slotsLeft:f.total-f.booked-1,wa:{ok:/^\d{10,13}$/.test(num0),url:'https://wa.me/'+num0+'?text='+encodeURIComponent(msg),message:msg}};
}
function setOrder(b){
  if(ST.indexOf(b.status)<0) throw new Error('Unknown status'); const o=orders().find(x=>x.id===String(b.id)); if(!o) throw new Error('Order not found.');
  if(o.status!=='Cancelled'&&b.status==='Cancelled') adj(o.frameId,-1);          // free the slot
  if(o.status==='Cancelled'&&b.status!=='Cancelled') adj(o.frameId,1);           // reopen: needs a free slot
  osh().getRange(o._r,11).setValue(b.status); return {status:b.status};
}
function saveFrame(b){
  const nm=t(b.name,80); if(nm.replace(/^'/,'').length<2) throw new Error('Frame name is required.');
  const tot=Math.floor(num(b.total)), pr=num(b.price), mc=Math.max(1,Math.min(12,Math.floor(num(b.maxCars))||1)), img=String(b.image||'');
  if(img&&!/^https:\/\/res\.cloudinary\.com\//.test(img)) throw new Error('Upload the image with the Upload button.');
  const sh=fsh(), ex=b.id&&frames().find(x=>x.id===String(b.id));
  if(ex){sh.getRange(ex._r,1,1,FH.length).setValues([[ex.id,nm,tot,ex.booked,tot>ex.booked,pr,img,t(b.description,500),mc]]);return {id:ex.id};}
  const id='F'+Date.now().toString(36).slice(-4).toUpperCase(); sh.appendRow([id,nm,tot,0,tot>0,pr,img,t(b.description,500),mc]); return {id};
}
function deleteFrame(b){
  const f=frames().find(x=>x.id===String(b.id)); if(!f) throw new Error('Frame not found.');
  if(orders().some(o=>o.frameId===f.id&&(o.status==='Pending'||o.status==='Confirmed'))) throw new Error('This frame has open orders. Complete or cancel them first.');
  fsh().deleteRow(f._r); return {deleted:f.id};
}
