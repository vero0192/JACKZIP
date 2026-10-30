import {requestSignal,zipStrings} from './request.js';
const LOCATION_API_ROOT="https://api.zippopotam.us";
const MAX_CONCURRENCY=8;
const LOCATION_REQUEST_TIMEOUT_MS=9_000;
const cache=new Map();

function countryForZip(zip){
  const n=Number(zip);
  if(/^00[67]/.test(zip)||/^009/.test(zip))return "pr";
  if(/^008/.test(zip))return "vi";
  if(zip==="96799")return "as";
  if(n>=96910&&n<=96932)return "gu";
  if(n>=96950&&n<=96952)return "mp";
  if(n>=96960&&n<=96970)return "mh";
  return "us";
}

export class LocationError extends Error{
  constructor(message,code="LOCATION_ERROR",details={}){super(message);this.name="LocationError";this.code=code;this.details=details}
}


async function fetchOne(zip,{signal}={}){
  if(signal?.aborted)throw new DOMException("Aborted","AbortError");
  if(cache.has(zip))return cache.get(zip);
  const request=requestSignal(signal,LOCATION_REQUEST_TIMEOUT_MS);const combined=request.signal;
  try{
    const country=countryForZip(zip);
    const response=await fetch(`${LOCATION_API_ROOT}/${country}/${encodeURIComponent(zip)}`,{
      signal:combined,cache:"force-cache",headers:{Accept:"application/json"},mode:"cors"
    });
    if(response.status===404){cache.set(zip,null);return null}
    if(!response.ok)throw new LocationError(`Postal location service returned HTTP ${response.status}.`,"HTTP",{status:response.status,zip});
    let payload;
    try{payload=await response.json()}catch{throw new LocationError("Postal location service returned unreadable data.","BAD_JSON",{zip})}
    if(String(payload?.['post code']??'')!==zip)throw new LocationError("Postal location response did not match the requested ZIP.","SCHEMA",{zip});
    const places=Array.isArray(payload?.places)?payload.places:[];
    const primary=places[0];
    if(!primary){cache.set(zip,null);return null}
    const place=String(primary["place name"]||"").trim();
    const state=String(primary["state abbreviation"]||(["pr","vi","as","gu","mp","mh"].includes(country)?country:"")).trim().toUpperCase();
    const stateName=String(primary.state||"").trim();
    const coordinate=value=>typeof value==="number"?value:typeof value==="string"&&value.trim()!==""?Number(value):NaN;
    const lat=coordinate(primary.latitude),lon=coordinate(primary.longitude);
    const alternatives=places.slice(1).map(p=>String(p?.["place name"]||"").trim()).filter(Boolean);
    const label=[place,state].filter(Boolean).join(", ")||`ZIP ${zip}`;
    const result={
      zip,countryCode:country.toUpperCase(),place,state,stateName,label,
      latitude:Number.isFinite(lat)&&Math.abs(lat)<=90?lat:null,
      longitude:Number.isFinite(lon)&&Math.abs(lon)<=180?lon:null,
      alternatives,
      provider:"Zippopotam.us",
      source:"GeoNames postal-code data via Zippopotam.us"
    };
    cache.set(zip,result);return result;
  }catch(err){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    if(err?.name==="AbortError")throw new LocationError("Postal location lookup timed out.","TIMEOUT",{zip});
    if(err instanceof LocationError)throw err;
    throw new LocationError("JACKZIP could not reach the postal location service.","NETWORK",{zip});
  }finally{request.cleanup()}
}

export async function fetchPostalLocations({zips,signal,onProgress}={}){
  const unique=zipStrings(zips);
  const map=new Map(),missing=[],failed=[];
  if(!unique.length)return {map,missing,failed,provider:"Zippopotam.us",source:"GeoNames postal-code data via Zippopotam.us"};

  let cursor=0,completed=0;
  const worker=async()=>{
    while(true){
      const idx=cursor++;
      if(idx>=unique.length)return;
      const zip=unique[idx];
      try{
        const loc=await fetchOne(zip,{signal});
        if(loc)map.set(zip,loc);else missing.push(zip);
      }catch(err){
        if(err?.name==="AbortError")throw err;
        failed.push({zip,reason:err instanceof LocationError?err.message:"Postal location lookup failed."});
      }finally{
        completed++;
        onProgress?.({stage:"location",completed,total:unique.length,zip});
      }
    }
  };
  const count=Math.min(MAX_CONCURRENCY,unique.length);
  await Promise.all(Array.from({length:count},()=>worker()));
  return {map,missing,failed,provider:"Zippopotam.us",source:"GeoNames postal-code data via Zippopotam.us"};
}

export function clearLocationCache(){cache.clear()}
