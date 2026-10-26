/* No tracking or submissions: the visitor reviews and sends their own email. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const collections = {
    kitchen: {number:'01',label:'قلب البيت',title:'مطبخ يجمعكم.',description:'مساحة للطبخ، وللحديث، وللحياة. نبدأ من طريقة استخدامك للمطبخ لنختار توزيعًا وتفاصيل تناسب يومك.',image:'assets/kitchen-detail.webp',alt:'مطبخ OPPEIN بجزيرة ممتدة وإضاءة دافئة',caption:'من مجموعة OPPEIN · MAHA Orient',features:['توزيع على مقاس المساحة','خيارات للخامات والتشطيبات','تخزين مريح وسهل الوصول'],interest:'مطبخ',cta:'ابدأ تصميم مطبخك'},
    wardrobe: {number:'02',label:'مساحة لكل تفاصيلك',title:'كل شيء، في مكانه.',description:'خزانة تلائم مساحتك وطريقة استخدامك. ناقش مع المصمم تقسيمات التعليق والأدراج والعرض للوصول إلى ترتيب يناسبك.',image:'../assets/images/wardrobe.jpg',alt:'خزائن ملابس فاتحة من الأرض إلى السقف مع تخزين مفتوح',caption:'تصوّر لمساحة الخزائن وغرفة الملابس',features:['تقسيم داخلي حسب احتياجك','تنسيق الأبواب مع ديكور الغرفة','استغلال مدروس للمساحة'],interest:'خزائن وغرفة ملابس',cta:'ابدأ تصميم خزانتك'},
    living: {number:'03',label:'مساحتك للراحة',title:'مكان لكل لَمّة.',description:'وحدات تخزين وعرض تكمّل غرفة المعيشة. ننسّق الاستخدام اليومي مع ما تحب أن تراه حولك، في مساحة مريحة ومتجانسة.',image:'../assets/images/living.jpg',alt:'وحدة تلفاز وخزائن معيشة بألوان هادئة ورفوف عرض',caption:'تصوّر لحلول المعيشة والتخزين',features:['وحدات تلفاز وخزائن مدمجة','رفوف لقطعك المفضلة','تنسيق الخامات والألوان'],interest:'معيشة وتخزين',cta:'ابدأ تصميم مساحتك'}
  };
  const branches = [
    {name:'المعبيلة',address:'المعبيلة السابعة، مقابل مدرسة الأجيال العصرية',query:'السندباد المعبيلة السابعة عمان'},
    {name:'العذيبة',address:'شارع 18 نوفمبر، بناية فيفا هايبر ماركت',query:'السندباد العذيبة شارع 18 نوفمبر عمان'},
    {name:'عبري',address:'المرتفع، بجوار بنك ظفار ومقابل جامع السلطان قابوس',query:'السندباد عبري عمان'},
    {name:'إبراء',address:'إبراء، بجوار مكة هايبر ماركت',query:'السندباد إبراء عمان'},
    {name:'صلالة',address:'مقابل بلدية ظفار واللولو القديم',query:'السندباد صلالة عمان'}
  ];
  let activeCollection = collections.kitchen;
  let activeBranch = 0;
  $('#year').textContent = new Date().getFullYear();

  const toggle = $('#menuToggle'), menu = $('#mobileMenu');
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','فتح القائمة');
    if(returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open ? 'إغلاق القائمة' : 'فتح القائمة');
  });
  menu.addEventListener('click',e=>{if(e.target.closest('a')) closeMenu();});
  document.addEventListener('click',e=>{if(!$('#header').contains(e.target)) closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden) closeMenu(true);});
  matchMedia('(min-width: 851px)').addEventListener('change',e=>{if(e.matches) closeMenu();});

  function tabs(root, pick, vertical = false) {
    const buttons = $$('[role=tab]',root);
    function activate(button) {
      buttons.forEach(b=>{b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});
      pick(button);
    }
    root.addEventListener('click',e=>{const b=e.target.closest('[role=tab]');if(b) activate(b);});
    root.addEventListener('keydown',e=>{
      const i=buttons.indexOf(document.activeElement);if(i<0)return;
      let next;
      if(e.key==='Home')next=0;
      else if(e.key==='End')next=buttons.length-1;
      else if(e.key===(vertical?'ArrowDown':'ArrowLeft'))next=(i+1)%buttons.length;
      else if(e.key===(vertical?'ArrowUp':'ArrowRight'))next=(i-1+buttons.length)%buttons.length;
      if(next===undefined)return;
      e.preventDefault();buttons[next].focus();activate(buttons[next]);
    });
  }
  tabs($('.collection-tabs'),button=>{
    const item=collections[button.dataset.collection];activeCollection=item;
    $('#collectionPanel').setAttribute('aria-labelledby',button.id);
    $('#collectionImage').src=item.image;$('#collectionImage').alt=item.alt;
    $('#collectionCaption').textContent=item.caption;
    $('#collectionNumber').textContent=item.number;$('#collectionLabel').textContent=item.label;
    $('#collectionTitle').textContent=item.title;$('#collectionDescription').textContent=item.description;
    $('#collectionFeatures').replaceChildren(...item.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    $('#collectionCta').firstChild.textContent=item.cta+' ';
    $('#collectionCta').dataset.interest=item.interest;
  });
  tabs($('.branch-picker'),button=>{
    activeBranch=Number(button.dataset.branch);const branch=branches[activeBranch];
    $('#branchPanel').setAttribute('aria-labelledby',button.id);
    $('#branchName').textContent='معرض '+branch.name;$('#branchAddress').textContent=branch.address;
    $('#branchMap').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(branch.query);
  },true);

  function focusForm() {
    closeMenu();
    $('#consultation').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
    $('#clientName').focus({preventScroll:true});
  }
  document.addEventListener('click',e=>{
    const interest=e.target.closest('[data-interest]');
    if(interest){$('#clientInterest').value=interest.dataset.interest;$('#clientInterest').removeAttribute('aria-invalid');focusForm();}
  });
  $('#bookBranch').addEventListener('click',()=>{$('#clientBranch').value=branches[activeBranch].name;$('#clientBranch').removeAttribute('aria-invalid');focusForm();});

  const imageDialog=$('#imageDialog'),requestDialog=$('#requestDialog');
  $('#expandImage').addEventListener('click',()=>{
    $('#dialogImage').src=activeCollection.image;$('#dialogImage').alt=activeCollection.alt;
    $('#imageDialogCaption').textContent=activeCollection.caption;imageDialog.showModal();
  });
  $$('dialog').forEach(dialog=>{
    $('[data-close]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  });

  const form=$('#consultationForm');
  const normaliseDigits = value => value.replace(/[٠-٩۰-۹]/g,c=>c.charCodeAt(0)>=1776?c.charCodeAt(0)-1776:c.charCodeAt(0)-1632);
  form.addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');$('#formError').textContent='';});
  form.addEventListener('change',e=>{e.target.removeAttribute('aria-invalid');$('#formError').textContent='';});
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#clientName').value.trim();
    const phone=normaliseDigits($('#clientPhone').value).replace(/[\s()-]/g,'');
    const invalid=[];
    if(name.length<2)invalid.push($('#clientName'));
    if(!/^(?:[279]\d{7}|(?:\+968|00968|968)[279]\d{7}|\+(?!968)\d{9,15})$/.test(phone))invalid.push($('#clientPhone'));
    if(!$('#clientInterest').value)invalid.push($('#clientInterest'));
    if(!$('#clientBranch').value)invalid.push($('#clientBranch'));
    $$('[aria-invalid]',form).forEach(el=>el.removeAttribute('aria-invalid'));
    if(invalid.length){invalid.forEach(el=>el.setAttribute('aria-invalid','true'));$('#formError').textContent='أكمل الحقول المطلوبة برقم عُماني صحيح، أو رقم دولي يبدأ بـ + ورمز الدولة.';invalid[0].focus();return;}
    const summary='الاسم: '+name+'\nالهاتف: '+phone+'\nالمساحة: '+$('#clientInterest').value+'\nالمعرض: '+$('#clientBranch').value+'\nالفكرة: '+($('#clientNotes').value.trim()||'أود مناقشتها مع المصمم');
    $('#requestSummary').textContent=summary;
    $('#sendEmail').href='mailto:info@sindbadom.com?subject='+encodeURIComponent('طلب استشارة تصميم — '+name)+'&body='+encodeURIComponent('مرحبًا فريق السندباد، أود طلب استشارة مجانية.\n\n'+summary);
    $('#copyStatus').textContent='';requestDialog.showModal();
  });
  $('#copyRequest').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('#requestSummary').textContent);$('#copyStatus').textContent='تم نسخ التفاصيل. يمكنك لصقها في رسالتك.';}
    catch{const range=document.createRange();range.selectNodeContents($('#requestSummary'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('#copyStatus').textContent='تم تحديد التفاصيل؛ استخدم أمر النسخ في جهازك.';}
  });

  if('IntersectionObserver' in window){
    const sticky=$('#mobileContact');const contactVisible=new Map();
    const observer=new IntersectionObserver(entries=>{entries.forEach(e=>contactVisible.set(e.target.id,e.isIntersecting));sticky.classList.toggle('is-hidden',[...contactVisible.values()].some(Boolean));},{threshold:0});
    observer.observe($('#home'));observer.observe($('#consultation'));
  }
})();
