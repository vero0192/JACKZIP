// Timeouts and cancellation share one signal; fallback listeners are always detached.
export function requestSignal(parent,timeoutMs){
  const controller=new AbortController();
  const abort=()=>controller.abort();
  if(parent?.aborted)abort();else parent?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,timeoutMs);
  return {signal:controller.signal,cleanup(){clearTimeout(timer);parent?.removeEventListener('abort',abort)}};
}
export function zipStrings(zips=[]){
  if(!Array.isArray(zips)||zips.some(zip=>typeof zip!=='string'||!/^\d{5}$/.test(zip)||zip==='00000'))throw new TypeError('ZIP lookup requires five-character ZIP strings.');
  return [...new Set(zips)];
}
