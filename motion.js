const reduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export function motionAllowed(){
  return !reduced()&&!document.documentElement.classList.contains("no-motion");
}

export function setMotionEnabled(enabled){
  document.documentElement.classList.toggle("no-motion",!enabled);
  if(!enabled){document.querySelectorAll(".fx-dot,.spark").forEach(el=>el.remove());document.getAnimations?.().forEach(animation=>animation.cancel())}
}

function removeAfterMotion(el){
  const timer=setTimeout(()=>el.remove(),1800);
  const cleanup=()=>{clearTimeout(timer);el.remove()};
  el.addEventListener("animationend",cleanup,{once:true});
  el.addEventListener("animationcancel",cleanup,{once:true});
}

export function popSpeech(el){
  if(!el||!motionAllowed())return;
  el.classList.remove("pop");void el.offsetWidth;el.classList.add("pop");
}

export function emitJaxFx(container,count=18,color="acid"){
  if(!container||!motionAllowed())return;
  const colors={acid:"#dfff4f",blue:"#5965ff",coral:"#ff6657",bone:"#f1ebdd"};
  for(let i=0;i<count;i++){
    const dot=document.createElement("i");dot.className="fx-dot";dot.style.background=colors[color]||colors.acid;dot.style.color=colors[color]||colors.acid;
    dot.style.left=`${35+Math.random()*30}%`;dot.style.top=`${32+Math.random()*40}%`;
    dot.style.setProperty("--x",`${(Math.random()-.5)*220}px`);dot.style.setProperty("--y",`${(Math.random()-.5)*210}px`);dot.style.setProperty("--dur",`${.7+Math.random()*.7}s`);
    container.appendChild(dot);removeAfterMotion(dot);
  }
}

export function burstResult(container,count=24){
  if(!container||!motionAllowed())return;
  for(let i=0;i<count;i++){
    const spark=document.createElement("i");spark.className="spark";
    spark.style.left=`${62+Math.random()*24}%`;spark.style.top=`${28+Math.random()*38}%`;
    const palette=["#dfff4f","#5965ff","#f1ebdd","#ff6657"];
    const c=palette[i%palette.length];spark.style.background=c;spark.style.color=c;
    spark.style.setProperty("--sx",`${(Math.random()-.5)*260}px`);spark.style.setProperty("--sy",`${(Math.random()-.6)*220}px`);spark.style.setProperty("--t",`${500+Math.random()*420}ms`);
    container.appendChild(spark);removeAfterMotion(spark);
  }
}

export function revealResult(el){
  if(!el)return;
  el.classList.remove("reveal");void el.offsetWidth;el.classList.add("reveal");
  if(!motionAllowed()||typeof el.animate!=="function")return;
  el.animate([{opacity:.55,transform:"translateY(9px) scale(.995)"},{opacity:1,transform:"translateY(0) scale(1)"}],{duration:420,easing:"cubic-bezier(.2,.8,.2,1)"});
}

export async function countMoney(el,value,formatter){
  if(!el)return;
  if(!motionAllowed()||!Number.isFinite(value)){el.textContent=formatter(value);return}
  const duration=520,start=performance.now();
  await new Promise(resolve=>{
    const tick=now=>{
      const t=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-t,3);el.textContent=formatter(Math.round(value*eased));
      if(t<1)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);
  });
}

export function setupStackObserver(container,cards,onIndex){
  if(!container||!cards.length||typeof IntersectionObserver==="undefined")return ()=>{};
  const root=container.closest?.(".stack-overlay")||null;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)onIndex?.(Number(visible.target.dataset.index)||0);
  },{root,threshold:[.35,.55,.75]});
  cards.forEach(card=>observer.observe(card));
  return ()=>observer.disconnect();
}
