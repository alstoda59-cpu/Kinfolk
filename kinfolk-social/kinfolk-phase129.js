(()=>{
  if(window.__kinfolkPhase129)return;
  window.__kinfolkPhase129=true;
  // Defense in depth against late legacy form handlers bypassing Phase79's age check.
  function age(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;
    const d=new Date(date+'T00:00:00');
    if(Number.isNaN(d.getTime())||d.getFullYear()!==Number(date.slice(0,4))||d.getMonth()+1!==Number(date.slice(5,7))||d.getDate()!==Number(date.slice(8,10)))return null;
    const now=new Date();let years=now.getFullYear()-d.getFullYear();
    if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))years--;
    return years;
  }
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form?.id!=='authForm'||form.dataset.kf73!=='1')return;
    const title=(form.querySelector('.kf73Title')?.textContent||'').toLowerCase();
    // Both Phase76 signup headings must be protected before legacy submit handlers run.
    if(!title.includes('create your kinfolk')&&!title.includes('create account'))return;
    const years=age(form.querySelector('#kf79Birthdate')?.value||'');
    if(years!==null&&years>=13&&years<=99)return;
    e.preventDefault();e.stopImmediatePropagation();
    const message=years===null?'Enter a valid birthday to create a Kinfolk account.':years<13?'Kinfolk accounts are available for ages 13 and older.':'Kinfolk accounts are available for ages 13–99.';
    let box=form.querySelector('.kf73Msg');
    if(!box){box=document.createElement('div');box.className='kf73Msg';form.appendChild(box)}
    box.style.display='block';box.style.color='#ffd9e7';box.textContent=message;
  },true);
  console.log('Kinfolk Recovery129 auth and profile guard ready');
})();
