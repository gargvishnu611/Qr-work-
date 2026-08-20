window.QR_SUPABASE_URL='https://ngephouenhxvpxoxytbm.supabase.co';
window.QR_SUPABASE_KEY='sb_publishable_qD_7_m9cYCcxQGp259iNgw_E2BPe0Rd';
window.QR_SUPABASE_READY=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload=()=>{try{window.qrSupabase=window.supabase.createClient(window.QR_SUPABASE_URL,window.QR_SUPABASE_KEY);resolve(window.qrSupabase)}catch(e){reject(e)}};
  s.onerror=()=>reject(new Error('Could not load Supabase client'));
  document.head.appendChild(s);
});
