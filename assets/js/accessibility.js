/* Keyboard navigation, accessible action names, and drawer focus management. */
(() => {
  'use strict';
  const actions = '[data-news],[data-progopen],[data-doc],[data-thread],[data-myreq],[data-req],[data-openmail],[data-go].kpi';
  function enhance(root) {
    if (!(root instanceof Element)) return;
    const nodes = [root, ...root.querySelectorAll(actions + ',button[title],main')];
    nodes.forEach(el => {
      if (el.matches(actions) && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
        el.tabIndex = 0;
        if (el.tagName !== 'TR') el.setAttribute('role','button');
      }
      if (el.matches('button[title]') && !el.getAttribute('aria-label')) el.setAttribute('aria-label',el.title);
      if (el.tagName === 'MAIN' && !el.id) el.id = 'mainContent';
    });
  }
  enhance(document.body);
  new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(enhance))).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches(actions) && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) {
      e.preventDefault();e.stopImmediatePropagation();e.target.click();
    }
  },true);
  const skip=document.createElement('a');skip.className='skip-link';skip.href='#';skip.textContent='انتقل إلى المحتوى / Skip to content';
  skip.addEventListener('click',e=>{e.preventDefault();const main=document.querySelector('main');if(main){main.tabIndex=-1;main.focus();main.scrollIntoView({block:'start'})}});
  document.body.prepend(skip);
  const drawer=document.getElementById('drawer');
  if(!drawer)return;
  drawer.setAttribute('aria-labelledby','dTitle');
  const menu=document.querySelector('#side.mmenu');
  const panels=[drawer,...(menu?[menu]:[])];
  if(menu){menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','القائمة / Menu')}
  let activePanel=null,returnFocus=null,previousOverflow='',background=[];
  function sync(){
    const next=panels.find(el=>el.classList.contains('open'))||null;
    panels.forEach(el=>{el.inert=el!==next;el.setAttribute('aria-hidden',String(el!==next))});
    if(next===activePanel)return;
    if(activePanel){background.forEach(([el,inert])=>el.inert=inert);background=[];document.body.style.overflow=previousOverflow}
    activePanel=next;
    if(next){
      returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      background=[...document.body.children].filter(el=>el!==next&&el.id!=='scrim'&&el.id!=='toast'&&el.tagName!=='DIALOG'&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
      background.forEach(([el])=>el.inert=true);
      next.inert=false;next.querySelector('button,input,select,textarea,[tabindex="0"]')?.focus();
    }else{
      background.forEach(([el,inert])=>el.inert=inert);background=[];document.body.style.overflow=previousOverflow;
      if(returnFocus?.isConnected&&!returnFocus.closest('[inert]'))returnFocus.focus();
      else{const main=document.querySelector('main');if(main){main.tabIndex=-1;main.focus()}}
    }
  }
  panels.forEach(el=>new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['class']}));sync();
  document.addEventListener('keydown',e=>{
    if(!activePanel||e.key!=='Tab'||document.querySelector('dialog[open]'))return;
    const items=[...activePanel.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length);
    const first=items[0],last=items[items.length-1];if(!first)return;
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
})();
