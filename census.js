import {requestSignal,zipStrings} from './request.js';
const API_ROOT="https://api.censusreporter.org/1.0/data/show";
export const PINNED_ACS_RELEASE="acs2024_5yr";
export const PINNED_ACS_YEAR="2024";
const TABLE="B19013";
const COLUMN="B19013001"; // Census Reporter column form for B19013_001E
const BATCH_SIZE=60;
const REQUEST_TIMEOUT_MS=20_000;

export class CensusError extends Error{
  constructor(message,code="CENSUS_ERROR",details={}){super(message);this.name="CensusError";this.code=code;this.details=details}
}
function chunks(items,size){const out=[];for(let i=0;i<items.length;i+=size)out.push(items.slice(i,i+size));return out}
async function fetchJson(url,{signal}={}){
  const request=requestSignal(signal,REQUEST_TIMEOUT_MS);const combined=request.signal;
  try{
    const response=await fetch(url,{signal:combined,cache:"no-store",headers:{Accept:"application/json"},mode:"cors"});
    if(!response.ok){const body=await response.json().catch(()=>null);throw new CensusError(`ACS relay returned HTTP ${response.status}. Try again in a moment.`,"HTTP",{status:response.status,missingGeography:typeof body?.error==="string"&&body.error.includes("doesn't include GeoID(s)")})}
    try{return await response.json()}catch{throw new CensusError("The ACS relay returned unreadable data.","BAD_JSON")}
  }catch(err){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    if(err?.name==="AbortError")throw new CensusError("ACS lookup timed out. Your parsed ZIPs are still safe.","TIMEOUT");
    if(err instanceof CensusError)throw err;
    throw new CensusError("JACKZIP could not reach the ACS relay. Your parsed ZIPs are still safe.","NETWORK");
  }finally{request.cleanup()}
}
function makeUrl(batch){
  const geoIds=batch.map(zip=>`86000US${zip}`).join(",");
  const params=new URLSearchParams({table_ids:TABLE,geo_ids:geoIds});
  return `${API_ROOT}/${PINNED_ACS_RELEASE}?${params.toString()}`;
}
function parseBatch(payload,batch){
  if(!payload||typeof payload!=="object"||!payload.data)throw new CensusError("The ACS relay returned an unexpected schema.","SCHEMA");
  const releaseId=String(payload.release?.id||"");
  if(releaseId!==PINNED_ACS_RELEASE)throw new CensusError("ACS release mismatch. JACKZIP stopped rather than mix vintages.","RELEASE_DRIFT",{expected:PINNED_ACS_RELEASE,received:releaseId});
  const map=new Map(),missing=[];
  for(const zip of batch){
    const geoid=`86000US${zip}`;const table=payload.data?.[geoid]?.[TABLE];
    if(!table){missing.push(zip);continue}
    const numeric=value=>typeof value==="number"?value:typeof value==="string"&&value.trim()!==""?Number(value):NaN;
    const estimate=numeric(table?.estimate?.[COLUMN]);const moe=numeric(table?.error?.[COLUMN]);
    const usable=Number.isFinite(estimate)&&estimate>=0;
    const rawName=String(payload.geography?.[geoid]?.name||"").trim();
    const geography=rawName&&rawName!==zip?rawName:`ZCTA ${zip}`;
    map.set(zip,{zip,geography,estimate:usable?estimate:null,moe:Number.isFinite(moe)&&moe>=0?moe:null,available:usable,
      releaseYear:PINNED_ACS_YEAR,releaseName:"2024 ACS 5-Year",releaseId:PINNED_ACS_RELEASE,
      source:"U.S. Census Bureau 2024 ACS 5-Year via Census Reporter relay",sourceMode:"PINNED_RELAY",
      table:TABLE,variable:"B19013_001E",moeVariable:"B19013_001M"});
  }
  return {map,missing};
}
export async function fetchIncomeRows({zips,signal,onProgress}={}){
  const unique=zipStrings(zips);
  if(!unique.length)return {map:new Map(),missing:[],failed:[],year:PINNED_ACS_YEAR,releaseName:"2024 ACS 5-Year",releaseId:PINNED_ACS_RELEASE,retrievedAt:new Date().toISOString(),provider:"Census Reporter",sourceMode:"PINNED_RELAY"};
  const batches=chunks(unique,BATCH_SIZE),map=new Map(),missing=[],failed=[];
  async function lookup(batch,batchIndex,totalBatches){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    try{
      const parsed=parseBatch(await fetchJson(makeUrl(batch),{signal}),batch);
      parsed.map.forEach((row,zip)=>map.set(zip,row));missing.push(...parsed.missing);
    }catch(err){
      if(err?.name==="AbortError"||err?.code==="RELEASE_DRIFT")throw err;
      // A rejected geography must not discard unrelated successful ZIPs in the batch.
      if(err?.code==="HTTP"&&err.details.missingGeography&&batch.length>1){
        const mid=Math.ceil(batch.length/2);await lookup(batch.slice(0,mid),batchIndex,totalBatches);await lookup(batch.slice(mid),batchIndex,totalBatches);return;
      }
      if(err?.code==="HTTP"&&err.details.missingGeography&&batch.length===1){missing.push(batch[0]);return}
      failed.push({zips:[...batch],reason:err instanceof CensusError?err.message:"Lookup batch failed."});
      onProgress?.({stage:"batch-error",batch:batchIndex,total:totalBatches,count:batch.length});
    }
  }
  for(let i=0;i<batches.length;i++){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    const batch=batches[i];onProgress?.({stage:"request",batch:i+1,total:batches.length,count:batch.length,release:PINNED_ACS_RELEASE});
    await lookup(batch,i+1,batches.length);
  }
  return {map,missing,failed,year:PINNED_ACS_YEAR,releaseName:"2024 ACS 5-Year",releaseId:PINNED_ACS_RELEASE,releaseYears:"2020–2024",retrievedAt:new Date().toISOString(),provider:"Census Reporter",source:"U.S. Census Bureau American Community Survey",sourceMode:"PINNED_RELAY",table:TABLE,variable:"B19013_001E",moeVariable:"B19013_001M"};
}
