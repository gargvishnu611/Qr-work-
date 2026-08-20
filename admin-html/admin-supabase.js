(() => {
  const STORE='qr-work-v6';
  const getLocal=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
  const setLocal=s=>localStorage.setItem(STORE,JSON.stringify(s));
  const toast=msg=>window.toast?window.toast(msg):console.info(msg);
  const wait=()=>window.QR_SUPABASE_READY;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function sb(){return await wait()}
  async function updateOnline(online){const client=await sb(); const r=await client.from('app_settings').upsert({id:'global',site_online:online,updated_at:new Date().toISOString()}); if(r.error)throw r.error;}
  async function syncRequests(){
    const client=await sb(); const r=await client.from('qr_requests').select('*').order('created_at',{ascending:false}).limit(50); if(r.error)return;
    const local=getLocal(); local.qrRequests=r.data||[]; setLocal(local);
    renderCloudRequests(r.data||[]);
  }
  function renderCloudRequests(rows){const el=document.getElementById('qrRequests');if(!el)return;el.innerHTML=rows.length?rows.map(r=>`<div class="row"><div class="row-main"><strong>${esc(r.title)}</strong><small>${esc(r.status)} • ${esc(r.account_id||r.email||'unknown')} • ${new Date(r.created_at).toLocaleString()}</small>${r.note?`<small>${esc(r.note)}</small>`:''}${r.task_id?'<small>QR task attached</small>':''}</div><span class="pill ${esc(r.status)}">${esc(r.status)}</span><div class="actions">${r.status==='pending'?`<button class="accept" data-approve="${r.id}">Approve</button><button class="reject" data-reject="${r.id}">Reject</button>`:''}${r.status==='approved'&&!r.task_id?`<button class="accept" data-use="${r.id}">Create QR task</button>`:''}</div></div>`).join(''):'<div class="empty">No QR requests yet.</div>';
    el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>reviewRequest(b.dataset.approve,'approved'));
    el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>reviewRequest(b.dataset.reject,'rejected'));
    el.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>useRequest(b.dataset.use));
  }
  async function reviewRequest(id,status){const client=await sb();const r=await client.from('qr_requests').update({status,reviewed_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message);toast(`Request ${status}`);syncRequests()}
  function useRequest(id){const rows=getLocal().qrRequests||[];const r=rows.find(x=>x.id===id);if(!r)return;const idField=document.getElementById('taskRequestId');if(idField)idField.value=r.id;document.getElementById('taskTitle').value=r.title||'';document.getElementById('taskInstructions').value=r.note||'';document.getElementById('taskQrFile').scrollIntoView({behavior:'smooth',block:'center'});toast('Approved request loaded. Upload QR photo and publish.');}
  async function uploadTask(e){
    const form=e.target; const file=document.getElementById('taskQrFile')?.files?.[0]; const requestId=document.getElementById('taskRequestId')?.value.trim();
    if(!file)return;
    try{
      const client=await sb(); const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`tasks/${Date.now()}-${safeName}`;
      const up=await client.storage.from('qr-tasks').upload(path,file,{upsert:false,contentType:file.type});
      if(up.error){console.error(up.error);toast('QR upload failed: run supabase-schema.sql first.');return;}
      const pub=client.storage.from('qr-tasks').getPublicUrl(path); const url=pub.data.publicUrl;
      // The existing admin form creates a local task. We mirror it into Supabase after its submit handler completes.
      setTimeout(async()=>{
        const local=getLocal(); const latest=(local.tasks||[]).filter(t=>t.status==='open').sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
        if(!latest)return;
        const inserted=await client.from('qr_tasks').insert({title:latest.title,instructions:latest.instructions||'',reward:Number(latest.reward),minutes:Number(latest.minutes)||10,qr_image_url:url,status:'open',assigned_to:'all',request_id:requestId||null}).select().single();
        if(inserted.error){toast(`Task sync failed: ${inserted.error.message}`);return;}
        latest.id=inserted.data.id;latest.qrImage=url;latest.cloud=true;local.tasks=local.tasks||[];setLocal(local);
        if(requestId){await client.from('qr_requests').update({status:'qr-published',task_id:inserted.data.id,published_at:new Date().toISOString()}).eq('id',requestId)}
        toast('QR task sent to Supabase');syncRequests();
      },300);
    }catch(err){console.error(err);toast('Could not connect to Supabase.');}
  }
  async function renderSiteStatus(){const client=await sb();const r=await client.from('app_settings').select('site_online').eq('id','global').single();if(r.error)return;const online=r.data?.site_online!==false;const box=document.getElementById('siteControl');if(!box)return;box.innerHTML=`<div><small>SITE CONTROL</small><h2>QR Work status</h2><p>${online?'Users can request QR work and receive published tasks.':'Requests and QR tasks are disabled.'}</p></div><button id="siteToggle" class="${online?'accept':'reject'}" type="button">${online?'● ONLINE — Turn offline':'○ OFFLINE — Turn online'}</button>`;document.getElementById('siteToggle').onclick=async()=>{try{await updateOnline(!online);toast(!online?'Site is ONLINE':'Site is OFFLINE');renderSiteStatus()}catch(e){toast(e.message)}}}
  function inject(){const form=document.getElementById('taskForm');if(form&&!form.dataset.cloudHook){form.dataset.cloudHook='1';form.addEventListener('submit',uploadTask,true)}}
  async function run(){try{inject();await renderSiteStatus();await syncRequests()}catch(e){console.error('Supabase admin sync',e)}}
  window.addEventListener('load',()=>{run();setInterval(run,5000)});
})();
