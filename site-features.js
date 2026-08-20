(() => {
  const STORE='qr-work-v6';
  const get=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
  const set=s=>localStorage.setItem(STORE,JSON.stringify(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>crypto.randomUUID?.()||`req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function ensure(){const s=get();s.settings={siteOnline:s.settings?.siteOnline!==false};s.qrRequests=Array.isArray(s.qrRequests)?s.qrRequests:[];set(s);return s}
  function online(){return ensure().settings.siteOnline!==false}
  function inject(){
    const work=document.getElementById('work'); if(!work||document.getElementById('requestQrCard')) return;
    const card=document.createElement('div'); card.id='requestQrCard'; card.className='card';
    card.innerHTML=`<div class="card-head"><div><span class="eyebrow">REQUEST QR</span><h3>Need a QR for testing?</h3></div><span class="small-badge" id="requestStatusBadge">Online</span></div>
      <p id="requestSiteMessage" class="muted">Send a request to admin. If approved, admin can attach a QR photo to your request.</p>
      <form id="qrRequestForm" class="form-card"><label>Request title<input id="qrRequestTitle" maxlength="80" placeholder="Netflix QR usability test" required></label><label>What do you need to test?<textarea id="qrRequestNote" rows="3" maxlength="300" placeholder="Briefly describe the authorized test. Do not include passwords, OTPs or UPI PINs."></textarea></label><button class="btn primary" type="submit" id="requestQrBtn">Send QR request</button></form>
      <div id="myQrRequests" class="recent"></div>`;
    work.insertBefore(card, work.querySelector('.active-work')||null);
    document.getElementById('qrRequestForm').addEventListener('submit',submitRequest);
    renderRequests(); updateOnlineUI();
  }
  function submitRequest(e){e.preventDefault(); if(!online()) return toast('Site is offline. QR requests are temporarily disabled.');
    const title=document.getElementById('qrRequestTitle').value.trim(); const note=document.getElementById('qrRequestNote').value.trim(); if(!title)return;
    const s=get(); s.qrRequests=Array.isArray(s.qrRequests)?s.qrRequests:[]; s.qrRequests.push({id:uid(),title,note,status:'pending',createdAt:Date.now(),email:s.email||'',accountId:s.accountId||''}); set(s); e.target.reset(); renderRequests(); toast('QR request sent to admin');
  }
  function renderRequests(){const el=document.getElementById('myQrRequests');if(!el)return;const s=get();const id=s.accountId||'';const mine=(s.qrRequests||[]).filter(r=>!id||r.accountId===id||r.email===s.email).slice(-5).reverse();el.innerHTML=mine.length?mine.map(r=>`<div class="recent-item"><i></i><div><b>${esc(r.title)}</b><small>${esc(r.status)} • ${new Date(r.createdAt).toLocaleString()}</small>${r.reason?`<small>${esc(r.reason)}</small>`:''}${r.taskId?'<small>QR task attached by admin</small>':''}</div></div>`).join(''):'<p class="muted">No QR requests yet.</p>';}
  function updateOnlineUI(){const on=online();const badge=document.getElementById('requestStatusBadge');const msg=document.getElementById('requestSiteMessage');const btn=document.getElementById('requestQrBtn');if(badge){badge.textContent=on?'Online':'Offline';badge.classList.toggle('offline',!on)}if(msg)msg.textContent=on?'Send a request to admin. If approved, admin can attach a QR photo to your request.':'Site is offline right now. New QR requests and QR work are temporarily disabled.';if(btn)btn.disabled=!on;
    const work=document.getElementById('work'); if(work){let banner=document.getElementById('siteOfflineBanner');if(!on&&!banner){banner=document.createElement('div');banner.id='siteOfflineBanner';banner.className='card';banner.innerHTML='<strong>Site offline</strong><p class="muted">QR generation/requesting is temporarily unavailable. Please try again later.</p>';work.insertBefore(banner,work.firstChild)}if(on&&banner)banner.remove();work.querySelectorAll('.task-card .btn.primary').forEach(b=>{b.disabled=!on;b.title=on?'':'Site offline'});}}
  const oldToast=window.toast; window.toast=msg=>oldToast?oldToast(msg):alert(msg);
  const observer=new MutationObserver(()=>{inject();updateOnlineUI();}); observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',()=>{updateOnlineUI();renderRequests()});
  window.addEventListener('load',()=>{ensure();inject();updateOnlineUI();setInterval(()=>{updateOnlineUI();renderRequests()},1500)});
})();