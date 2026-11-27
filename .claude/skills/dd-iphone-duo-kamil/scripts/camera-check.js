(async()=>{const S=ms=>new Promise(r=>setTimeout(r,ms));await S(3500);
const ph=document.getElementById('phone'),f=document.querySelector('#screen'),res={};
const hit=(a,c,m)=>a.left<c.right+m&&a.right>c.left-m&&a.top<c.bottom+m&&a.bottom>c.top-m;
function scan(tag,root){const d=f.contentDocument,w=d.defaultView,fr=f.getBoundingClientRect(),k=fr.width/w.innerWidth,out=[];
 const cams=[...ph.querySelectorAll('.island,.duo-cam')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect()).filter(r=>r.width);
 for(const c of cams)for(const el of [root,...root.querySelectorAll('*')]){const cs=w.getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;
  const solid=el.matches('button,a,input,textarea,img,svg,.c-ico,h1,h2,h3,p,span')||(cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&!el.matches('.c-sheet,.c-dialog'));if(!solid)continue;
  const q=el.getBoundingClientRect();if(!q.width||!q.height)continue;const r={left:fr.left+q.left*k,right:fr.left+q.right*k,top:fr.top+q.top*k,bottom:fr.top+q.bottom*k};
  if(hit(r,c,0))out.push(el.tagName+'.'+(el.className.baseVal??el.className).toString().split(' ')[0]+' "'+el.textContent.trim().slice(0,12)+'" '+[q.left,q.top,q.right,q.bottom].map(Math.round))}
 res[tag]=out.length?[...new Set(out)].slice(0,5):'clear'}
const w=f.contentWindow;
w.OTW.sheet('<p>Option one</p><p>Option two</p><button class="c-btn">Do it</button>','Options');await S(900);scan('sheet',f.contentDocument.getElementById('otw-sheet'));w.C.close('otw-sheet');await S(400);
w.OTW.confirmBox('Delete post?','This cannot be undone.','Delete',()=>{},true);await S(900);scan('alert',f.contentDocument.getElementById('otw-dialog'));w.C.close('otw-dialog');await S(400);
w.C.toast('Saved to your profile',{action:'Undo'});await S(700);scan('toast',f.contentDocument.querySelector('.c-toast'));
const m=f.contentDocument.querySelector('.duo-more');if(m&&!m.hidden){m.click();await S(500);const mm=f.contentDocument.querySelector('.duo-more__menu,.duo-menu,[role=menu]');if(mm)scan('more',mm);}
return JSON.stringify({pose:ph.getAttribute('data-duo'),res})})()
