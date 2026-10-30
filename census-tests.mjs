import assert from "node:assert/strict";
import {PINNED_ACS_RELEASE,PINNED_ACS_YEAR,CensusError,fetchIncomeRows} from "./census.js";
assert.equal(PINNED_ACS_RELEASE,"acs2024_5yr");
assert.equal(PINNED_ACS_YEAR,"2024");
assert.equal(new CensusError("x").name,"CensusError");
const originalFetch=globalThis.fetch;
try{
  for(const value of [null,undefined,"",-666666666,125000]){
    globalThis.fetch=async()=>({ok:true,json:async()=>({release:{id:PINNED_ACS_RELEASE},data:{"86000US03076":{B19013:{estimate:{B19013001:value},error:{B19013001:null}}}}})});
    const result=await fetchIncomeRows({zips:["03076"]});
    const row=result.map.get("03076");
    assert.equal(row.estimate,value===125000?125000:null,"Missing or special ACS value must never become zero");
    assert.equal(row.moe,null,"Missing MOE must stay missing");
    assert.equal(row.available,value===125000);
  }
  globalThis.fetch=async()=>{throw new Error("offline")};
  const offline=await fetchIncomeRows({zips:["03076"]});
  assert.equal(offline.map.size,0);
  assert.deepEqual(offline.failed[0].zips,["03076"]);
  globalThis.fetch=async()=>({ok:true,json:async()=>({release:{id:"acs2023_5yr"},data:{}})});
  await assert.rejects(fetchIncomeRows({zips:["03076"]}),err=>err.code==="RELEASE_DRIFT");
  globalThis.fetch=async input=>{
    if(String(input).includes('99999'))return {ok:false,status:400,json:async()=>({error:"The ACS 2024 5-year release doesn't include GeoID(s) 86000US99999."})};
    return {ok:true,json:async()=>({release:{id:PINNED_ACS_RELEASE},data:{"86000US03076":{B19013:{estimate:{B19013001:142000},error:{B19013001:8000}}}}})};
  };
  const split=await fetchIncomeRows({zips:['03076','99999']});
  assert.equal(split.map.get('03076').estimate,142000);assert.deepEqual(split.missing,['99999']);assert.equal(split.failed.length,0);
  globalThis.fetch=async()=>({ok:false,status:400,json:async()=>({error:'Invalid request'})});
  const badRequest=await fetchIncomeRows({zips:['03076']});assert.equal(badRequest.failed.length,1);assert.equal(badRequest.missing.length,0);
  globalThis.fetch=async()=>({ok:true,json:async()=>({data:{}})});
  await assert.rejects(fetchIncomeRows({zips:['03076']}),err=>err.code==='RELEASE_DRIFT');
  await assert.rejects(fetchIncomeRows({zips:[3076]}),TypeError);
}finally{globalThis.fetch=originalFetch}
console.log("census tests: PASS (missing values, MOE, failure preservation, vintage)");
