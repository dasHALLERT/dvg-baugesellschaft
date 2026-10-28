const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);

// Scroll-controlled, reversible comic interlude. No wheel interception or scroll locking.
const story = document.querySelector('.scroll-story');
if (story) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = story.querySelector('.hero');
  const scene = story.querySelector('.monte-scene');
  const pipe = story.querySelector('.pipe-wrap');
  const character = story.querySelector('.monte-character');
  const shadow = story.querySelector('.monte-shadow');
  const caption = story.querySelector('.scene-caption');
  const outro = story.querySelector('.story-outro');
  const canvas = story.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const meter = story.querySelector('.scene-progress>span');
  const skip = story.querySelector('.skip-scene');
  const dropLayer = story.querySelector('.flying-drops');
  const drops = Array.from({length:22},(_,i) => {
    const el=document.createElement('i'); dropLayer.append(el);
    return {el,angle:i*2.39996,distance:90+(i%6)*40,delay:(i%5)*.009};
  });
  let queued=false, width=0, height=0, skipped=false, previousP=-1;
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const ease=(v)=>v*v*(3-2*v);
  function resizeCanvas(){
    previousP=-1;
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  function drawSplash(p){
    ctx.clearRect(0,0,width,height);
    if(p<.635||p>.965)return;
    const hit=ease(phase(p,.635,.715));
    const drain=ease(phase(p,.76,.965));
    const cx=width*.51,cy=height*.5;
    if(p<.715){
      ctx.save();ctx.translate(cx,cy);ctx.scale(hit,hit);
      const max=Math.hypot(width,height)*.72;
      ctx.beginPath();
      for(let i=0;i<=160;i++){
        const a=i/160*Math.PI*2;
        const r=max*(.78+.12*Math.sin(a*11)+.06*Math.cos(a*19));
        const x=Math.cos(a)*r,y=Math.sin(a)*r;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();const g=ctx.createRadialGradient(0,0,5,0,0,max);
      g.addColorStop(0,'#a26b37');g.addColorStop(.45,'#80502b');g.addColorStop(1,'#4e301e');ctx.fillStyle=g;ctx.fill();ctx.restore();
    } else {
      // The uneven upper edge travels down, progressively clearing the screen from the top.
      const edge=-height*.32+drain*height*1.65;
      const wave=width/9;
      ctx.beginPath();ctx.moveTo(-50,height+100);ctx.lineTo(-50,edge);
      for(let x=-50;x<=width+60;x+=8){
        const y=edge+Math.sin(x/wave*2.1)*height*.045+Math.sin(x/wave*4.3+.8)*height*.028;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(width+60,height+100);ctx.closePath();
      const g=ctx.createLinearGradient(0,edge,0,height+100);g.addColorStop(0,'#a87543');g.addColorStop(.1,'#80502b');g.addColorStop(1,'#4d2d1c');ctx.fillStyle=g;ctx.fill();
      // Rounded, independently stretching rivulets under the receding film.
      for(let i=0;i<12;i++){
        const x=(i+.4)/12*width;
        const y=edge+Math.sin(x/wave*2.1)*height*.045+Math.sin(x/wave*4.3+.8)*height*.028;
        const len=(45+(i%4)*25)*(1-drain*.5),r=7+(i%3)*5;
        ctx.beginPath();ctx.moveTo(x-r,y+9);ctx.lineTo(x-r,y-len+r);ctx.quadraticCurveTo(x-r,y-len,x,y-len);ctx.quadraticCurveTo(x+r,y-len,x+r,y-len+r);ctx.lineTo(x+r,y+10);ctx.closePath();ctx.fillStyle='#a87543';ctx.fill();
        ctx.beginPath();ctx.moveTo(x-2,y-4);ctx.lineTo(x-2,y-len+12);ctx.strokeStyle='#d19b6060';ctx.lineWidth=2;ctx.stroke();
      }
    }
    // Wet comic highlights and splash bubbles move with the coating.
    ctx.save();ctx.globalAlpha=(1-drain)*hit*.45;
    for(let i=0;i<27;i++){
      const x=((i*173)%997)/997*width,y=((i*337)%991)/991*height+drain*height;
      ctx.beginPath();ctx.ellipse(x,y,3+i%5,7+i%9,-.5,0,Math.PI*2);ctx.fillStyle=i%3?'#c59257':'#422617';ctx.fill();
    }
    ctx.restore();
  }
  function render(){
    queued=false;
    if(motion.matches||skipped)return;
    const rect=story.getBoundingClientRect();
    const p=clamp(-rect.top/Math.max(1,story.offsetHeight-window.innerHeight));
    if(p===previousP)return; previousP=p;
    const fade=1-ease(phase(p,.025,.16));
    hero.style.opacity=fade;
    hero.style.transform=`translateY(${-phase(p,0,.18)*65}px) scale(${1-phase(p,0,.18)*.04})`;
    hero.style.visibility=fade<=0?'hidden':'visible';
    hero.inert=fade<.15;
    scene.style.opacity=ease(phase(p,.075,.19))*(1-phase(p,.7,.82));
    const rise=ease(phase(p,.12,.36));
    pipe.style.transform=`translate(-50%,${95-rise*145}%) scale(${.35+rise*.65}) rotate(${-7+rise*7}deg)`;
    caption.style.opacity=1-phase(p,.32,.4);
    caption.style.transform=`translateY(${-phase(p,.25,.45)*40}px)`;
    // Finish the gulli rise first, then expand the central shadow, then reveal Monte.
    const shadowGrow=ease(phase(p,.36,.44));
    const emerge=ease(phase(p,.42,.52)),launch=phase(p,.52,.65);
    const size=(.06+emerge*.74)+Math.pow(launch,3)*10;
    const opacity=phase(p,.42,.46)*(1-phase(p,.65,.69));
    character.style.opacity=opacity;
    character.style.left="50%";
    character.style.top=`${50-emerge*4-launch*3}%`;
    character.style.transform=`translate(-50%,-50%) scale(${size}) rotate(${-7+emerge*2+launch*13}deg)`;
    shadow.style.opacity=phase(p,.36,.39)*(1-phase(p,.58,.66));
    shadow.style.transform=`translate(-50%,-50%) scale(${.03+shadowGrow*1.25})`;
    drops.forEach(({el,angle,distance,delay})=>{
      const burst=phase(p,.41+delay,.65+delay);
      el.style.opacity=burst*(1-phase(p,.63,.69));
      el.style.transform=`translate(${Math.cos(angle)*distance*burst*2}px,${Math.sin(angle)*distance*burst*2}px) rotate(${angle*120+burst*250}deg) scale(${.3+burst*2.5})`;
    });
    const reveal=phase(p,.72,.81);
    outro.style.opacity=reveal;outro.style.pointerEvents=p>.89?'auto':'none';outro.inert=p<.89;
    meter.style.transform=`scaleX(${p})`;
    skip.style.opacity=p>.97?'0':'1';skip.disabled=p>.97;
    drawSplash(p);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  function applyMotion(){
    document.body.classList.toggle('scene-muted',motion.matches||skipped);
    if(motion.matches||skipped){hero.inert=false;hero.style.visibility='visible';hero.style.opacity='1';hero.style.transform='none';outro.inert=true;ctx.clearRect(0,0,width,height);}else{resizeCanvas();schedule();}
  }
  skip.addEventListener('click',()=>{
    skipped=true;applyMotion();
    const target=document.querySelector('#leistungen');target.setAttribute('tabindex','-1');target.scrollIntoView({behavior:'instant'});target.focus({preventScroll:true});
  });
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{resizeCanvas();schedule();},{passive:true});
  motion.addEventListener('change',applyMotion);
  document.body.classList.add('story-ready');
  resizeCanvas();applyMotion();
}

// Accessible enlargement for project photos on the individual service pages.
const lightbox = document.querySelector('.project-lightbox');
if (lightbox) {
  const triggers = [...document.querySelectorAll('.gallery-open')];
  const image = lightbox.querySelector('.lightbox-image');
  const caption = lightbox.querySelector('.lightbox-caption');
  const count = lightbox.querySelector('.lightbox-count');
  const previous = lightbox.querySelector('.lightbox-prev');
  const next = lightbox.querySelector('.lightbox-next');
  let current = 0;
  function showPhoto(index) {
    current = (index + triggers.length) % triggers.length;
    image.src = triggers[current].dataset.full;
    image.alt = triggers[current].dataset.caption;
    image.removeAttribute('aria-hidden');
    caption.textContent = image.alt;
    count.textContent = `${current + 1} / ${triggers.length}`;
    previous.disabled = next.disabled = triggers.length < 2;
  }
  triggers.forEach((trigger,index) => trigger.addEventListener('click',()=>{showPhoto(index);lightbox.showModal();}));
  lightbox.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
  previous.addEventListener('click',()=>showPhoto(current-1));
  next.addEventListener('click',()=>showPhoto(current+1));
  lightbox.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(current-1);}
    if(event.key==='ArrowRight'){event.preventDefault();showPhoto(current+1);}
  });
  lightbox.addEventListener('click',event=>{if(event.target===lightbox){const r=lightbox.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)lightbox.close();}});
}
