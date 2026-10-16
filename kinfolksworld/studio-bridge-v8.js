const notify=()=>{try{parent.postMessage({type:'kinfolksworld-layout-saved',at:Date.now()},'*')}catch{}};
for(const id of ['saveLayout','saveSettings','clearLayout']){document.getElementById(id)?.addEventListener('click',()=>setTimeout(notify,700));}
document.getElementById('createRoom')?.addEventListener('click',()=>setTimeout(notify,900));
document.getElementById('backWorld')?.addEventListener('click',e=>{e.preventDefault();notify();try{parent.postMessage('kinfolksworld-close-studio','*')}catch{}});