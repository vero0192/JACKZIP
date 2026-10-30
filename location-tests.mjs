import assert from "node:assert/strict";
import {fetchPostalLocations,clearLocationCache} from "./location.js";
clearLocationCache();
const calls=[];
globalThis.fetch=async input=>{
  const url=new URL(String(input));calls.push(url);
  const parts=url.pathname.split("/").filter(Boolean);const country=parts.at(-2);const zip=parts.at(-1);
  const known={
    "00646":{place:"Dorado",state:"Puerto Rico",abbr:"PR",lat:"18.43",lon:"-66.28"},
    "03076":{place:"Pelham",state:"New Hampshire",abbr:"NH",lat:"42.73",lon:"-71.32"}
  }[zip];
  if(!known)return {ok:false,status:404,json:async()=>({})};
  return {ok:true,status:200,json:async()=>({"post code":zip,places:[{"place name":known.place,state:known.state,"state abbreviation":known.abbr,latitude:known.lat,longitude:known.lon}]})};
};
const result=await fetchPostalLocations({zips:["00646","03076","99999"]});
assert.equal(result.map.get("00646").label,"Dorado, PR");
assert.equal(calls.find(u=>u.pathname.endsWith("/00646")).pathname,"/pr/00646");
assert.equal(result.map.get("03076").label,"Pelham, NH");
assert.deepEqual(result.missing,["99999"]);
assert.equal(result.failed.length,0);
assert.equal(calls.length,3);
await fetchPostalLocations({zips:['00646']});assert.equal(calls.length,3,'Postal cache should avoid another request');
clearLocationCache();
globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({'post code':'03076',places:[{'place name':'Pelham','state abbreviation':'NH',latitude:null,longitude:false}]})});
const absent=await fetchPostalLocations({zips:['03076']});
assert.equal(absent.map.get('03076').latitude,null);assert.equal(absent.map.get('03076').longitude,null);
clearLocationCache();globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({'post code':'10001',places:[]})});
const mismatch=await fetchPostalLocations({zips:['03076']});assert.equal(mismatch.failed.length,1);
await assert.rejects(fetchPostalLocations({zips:[3076]}),TypeError);
console.log("location adapter tests: PASS");
