(() => {
  async function ready(){return window.QR_SUPABASE_READY?window.QR_SUPABASE_READY:null}
  const toast = msg => window.toast ? window.toast(msg) : console.info(msg);
  const store='qr-work-v6';
  const getLocal=()=>{try{return JSON.parse(localStorage.getItem(store)||'{}')}catch{return {}}};
  const setLocal=s=>localStorage.setItem(store,JSON.stringify(s));
  const safe=async(fn)=>{try{const sb=await ready();return await fn(sb)}catch(e){console.error(e);return null}};

  function injectRequestUI(){
    const work=document.getElementById('work');
    if(!work || document.getElementById('requestQrCard')) return;
    const card=document.createElement('div');
    card.id='requestQrCard'; card.className='card';
    card.innerHTML=`<div class="card-head"><div><span class="eyebrow">REQUEST WORK</span><h3>Need a QR test?</h3></div><span class="small-badge" id="siteStateBadge">Checking...</span></div><p>Send a test request to the admin. An admin must approve it and attach the authorized QR photo before it becomes available.</p><form id="qrRequestForm"><label>Request title<input id="qrRequestTitle" maxlength="120" required placeholder="Checkout QR test"></label><label>Details<textarea id="qrRequestNote" rows="3" maxlength="500" placeholder="What should be tested?"></textarea></label><button class="btn primary" type="submit" id="qrRequestBtn">Send request</button></form><div class="request-status" id="myRequestStatus"></div>`;
    work.insertBefore(card,work.firstChild);
    document.getElementById('qrRequestForm').addEventListener('submit', async e=>{
      e.preventDefault();
      const local=getLocal();
      const online=await getOnline();
      if(!online) return toast('Site is offline. New QR requests are disabled.');
      const email=local.email||''; const accountId=local.accountId||'';
      const title=document.getElementById('qrRequestTitle').value.trim(); const note=document.getElementById('qrRequestNote').value.trim();
      if(!title) return toast('Enter a request title.');
      const result=await safe(sb=>sb.from('qr_requests').insert({title,note,email,account_id:accountId}).select().single());
      if(result?.error) return toast(`Request failed: ${result.error.message}`);
      document.getElementById('qrRequestForm').reset(); toast('Request sent to admin'); await refreshRequests();
    });
  }
  async function getOnline(){
    const result=await safe(sb=>sb.from('app_settings').select('site_online').eq('id','global').single());
    return result?.data?.site_online!==false;
  }
  async function refreshSettings(){
    const online=await getOnline(); const badge=document.getElementById('siteStateBadge'); if(badge){badge.textContent=online?'ONLINE':'OFFLINE';badge.style.color=online?'#159a61':'#dc3b57'}
    const btn=document.getElementById('qrRequestBtn'); if(btn){btn.disabled=!online;btn.textContent=online?'Send request':'Site offline'}
  }
  async function refreshRequests(){
    const local=getLocal(); if(!local.email && !local.accountId) return;
    const result=await safe(sb=>sb.from('qr_requests').select('*').or(`email.eq.${encodeURIComponent(local.email||'')},account_id.eq.${encodeURIComponent(local.accountId||'')}`).order('created_at',{ascending:false}).limit(8));
    const el=document.getElementById('myRequestStatus'); if(!el||result?.error)return;
    el.innerHTML=(result.data||[]).map(r=>`<div class="request-status-row"><b>${escapeHtml(r.title)}</b><span>${escapeHtml(r.status)}</span></div>`).join('')||'<small>No requests yet.</small>';
  }
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function syncTasks(){
    const online=await getOnline();
    const result=await safe(sb=>sb.from('qr_tasks').select('*').eq('status','open').order('created_at',{ascending:false}));
    if(result?.error || !result?.data) return;
    const local=getLocal();
    local.tasks=(result.data||[]).map(t=>({id:t.id,title:t.title,instructions:t.instructions||'',reward:Number(t.reward),minutes:Number(t.minutes),status:'open',qrImage:t.qr_image_url,createdAt:new Date(t.created_at).getTime(),assignedTo:t.assigned_to||'all',cloud:true}));
    local.cloudOnline=online; setLocal(local);
    if(window.state){window.state=typeof window.normalize==='function'?window.normalize(local):local; if(window.renderAll)window.renderAll();}
    if(window.renderTasks)window.renderTasks();
    const badge=document.getElementById('siteStateBadge');if(badge){badge.textContent=online?'ONLINE':'OFFLINE';badge.style.color=online?'#159a61':'#dc3b57'}
  }

  async function monitor(){injectRequestUI(); await syncTasks(); await refreshSettings(); await refreshRequests();}
  window.addEventListener('load',()=>{monitor();setInterval(monitor,5000)});
})();
