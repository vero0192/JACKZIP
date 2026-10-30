/* JACKZIP v5 ingestion engine
   Regex discovers candidates. Structure + context decide what they mean.
   Canonical ZIP values remain strings at every stage. */

const CARDISH_RE=/(?:\d[ -]*?){13,19}/g;
const PLACEHOLDERS=new Set(["00000","TBC","N/A","NA","NONE","NULL","UNKNOWN","-"]);
const NEGATIVE_LABEL_RE=/\b(?:bin|id|order|sku|product|price|amount|total|exp(?:iration)?(?:\s*date)?|account|reference|serial|invoice|customer\s*id)\b/i;
const ZIP_LABEL_RE=/\b(?:zip(?:\s*code)?|postal\s*code)\b/i;
const URLISH_RE=/(?:https?:\/\/|www\.|\/[A-Za-z0-9_-]+\/)/i;
const COPYRIGHT_RE=/\b(?:copyright|©)\b/i;
const FOREIGN_5_3_RE=/(?<!\d)(\d{5})-(\d{3})(?!\d)/g;
const ZIP4_RE=/(?<!\d)(\d{5})-(\d{4})(?!\d)/g;
const RANGE_RE=/(?<!\d)(\d{5})\s*(?:-|–|—|\bto\b|\bthru\b|\bthrough\b)\s*(\d{5})(?!\d)/gi;
const ZIP5_RE=/(?<!\d)(\d{5})(?!\d)/g;
const SHORT_ZIP_RE=/(?<!\d)(\d{3,4})(?!\d)/g;

const US_STATES={
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",PR:"Puerto Rico",VI:"U.S. Virgin Islands",GU:"Guam",AS:"American Samoa",MP:"Northern Mariana Islands"};
const STATE_NAME_TO_ABBR=new Map(Object.entries(US_STATES).map(([a,n])=>[n.toLowerCase(),a]));
const FOREIGN_CODES=new Set(["GB","UK","BR","AU","CA","MX","DE","FR","IT","ES","PT","PL","NL","BE","CH","AT","IE","SE","NO","DK","FI","JP","CN","IN","ZA","NZ"]);
const FOREIGN_NAMES=["brazil","australia","canada","mexico","united kingdom","england","scotland","wales","germany","france","italy","spain","portugal","poland","netherlands","belgium","switzerland","austria","ireland","sweden","norway","denmark","finland","japan","china","india","south africa","new zealand"];

function looksLikeLuhnCard(value){
  const digits=value.replace(/\D/g,"");
  if(digits.length<13||digits.length>19)return false;
  let sum=0,alt=false;
  for(let i=digits.length-1;i>=0;i--){let n=Number(digits[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}
  return sum%10===0;
}
export function detectSensitiveInput(text){
  const raw=String(text||"");const reasons=[];
  const cardish=raw.match(CARDISH_RE)||[];
  if(cardish.some(looksLikeLuhnCard))reasons.push("payment-card-like number");
  if(/\b(cvv|cvc|security\s*code)\b\s*[:=]?\s*\d{3,4}\b/i.test(raw))reasons.push("card security code");
  if(/\b(password|passcode|pin)\s*[:=]\s*\S+/i.test(raw))reasons.push("credential-like field");
  if(/\b(routing|bank\s*account|account\s*number)\s*[:=]\s*\d{6,}\b/i.test(raw))reasons.push("bank-account-like field");
  return {blocked:reasons.length>0,reasons};
}

function stateEvidence(text){
  const s=String(text||"");
  for(const [abbr,name] of Object.entries(US_STATES)){
    if(new RegExp(`\\b${abbr}\\b`).test(s.toUpperCase()))return {abbr,name,source:"abbr"};
    if(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,`i`).test(s))return {abbr,name,source:"name"};
  }
  return null;
}
function foreignEvidence(text){
  const s=String(text||"");const up=s.toUpperCase();
  const code=up.match(/(?:^|[|,;\s])([A-Z]{2})(?=[|,;\s]|$)/)?.[1];
  if(code&&FOREIGN_CODES.has(code)&&!US_STATES[code])return {code,label:code};
  const name=FOREIGN_NAMES.find(n=>new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,`i`).test(s));
  return name?{code:null,label:name}:null;
}
function detectStructures(text,lines){
  const out=new Set();
  if(/\t/.test(text))out.add("TSV_LIKE");
  if(lines.some(l=>l.split(",").length>=3))out.add("CSV_LIKE");
  if(lines.some(l=>l.split("|").length>=3))out.add("PIPE_DELIMITED");
  if(lines.some(l=>l.split(";").length>=3))out.add("SEMICOLON_DELIMITED");
  if(/\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?|city|state|zip)\b/i.test(text))out.add("ADDRESS_BLOCKS");
  if(RANGE_RE.test(text)){out.add("ZIP_RANGE_LIST");RANGE_RE.lastIndex=0}
  if(/\b(?:ocr|buy|info|base|valid\s*%)\b/i.test(text)||/\n\s*\n/.test(text))out.add("STACKED_RECORDS");
  if(!out.size&&lines.filter(Boolean).length&&lines.filter(Boolean).every(l=>/^\s*\d{5}\s*$/.test(l)))out.add("PLAIN_ZIP_LIST");
  if(!out.size)out.add("MIXED");
  return [...out];
}
function splitDelimited(line,delimiter){
  const cells=[];let value="",quoted=false;
  for(let i=0;i<line.length;i++){
    const char=line[i];
    if(char==='"'){
      if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted;
    }else if(char===delimiter&&!quoted){cells.push(value.trim());value=""}
    else value+=char;
  }
  cells.push(value.trim());return cells;
}
function detectHeaderSchema(lines){
  for(let i=0;i<Math.min(lines.length,18);i++){
    const raw=lines[i];
    for(const delimiter of ["\t","|",",",";"]){
      if(!raw.includes(delimiter))continue;
      const cells=splitDelimited(raw,delimiter);
      const zipIndex=cells.findIndex(c=>/^(?:zip|zip\s*code|postal\s*code)$/i.test(c));
      if(zipIndex>=0)return {lineIndex:i,delimiter,zipIndex,headers:cells};
    }
  }
  return null;
}
function shortZipAllowed(state,padded){
  const n=Number(padded); if(!Number.isFinite(n))return false;
  switch(state){
    case "PR":return /^(006|007|009)/.test(padded);
    case "VI":return /^008/.test(padded);
    case "MA":return (n>=1000&&n<=2799)||/^055/.test(padded);
    case "RI":return n>=2800&&n<=2999;
    case "NH":return n>=3000&&n<=3899;
    case "ME":return n>=3000&&n<=4999;
    case "VT":return n>=5000&&n<=5999;
    case "CT":return n>=6000&&n<=6999;
    case "NJ":return n>=7000&&n<=8999;
    case "NY":return /^005/.test(padded)||padded==="06390"||(n>=10000&&n<=14999);
    default:return false;
  }
}
function contextWindow(lines,index,radius=2){return lines.slice(Math.max(0,index-radius),Math.min(lines.length,index+radius+1)).join(" ").trim()}
function reasonItem(token,line,raw,reason,extra={}){return {token,line,raw,reason,...extra}}

export function extractZipCandidates(text){
  const rawInput=String(text||"").replace(/\r\n?/g,"\n");
  const lines=rawInput.split("\n");
  const structures=detectStructures(rawInput,lines);
  const schema=detectHeaderSchema(lines);
  const occurrences=[];const review=[];const ignored=[];const ranges=[];const invalid=[];const nonUs=[];
  let occurrenceSeq=0;
  const addOccurrence=(zip,lineNo,raw,original,extra={})=>occurrences.push({
    occurrenceId:`occ_${++occurrenceSeq}`,candidateId:`zip_${zip}`,zip,baseZip:zip,rawToken:original,original,
    line:lineNo,lines:[lineNo],raw,classification:extra.classification||"CONFIRMED",warningCodes:extra.warningCodes||[],
    sourceContext:extra.sourceContext||"",sourceState:extra.sourceState||null,sourceCountry:extra.sourceCountry||null,
    normalization:extra.normalization||null,formatStatus:extra.formatStatus||"VALID_ZIP5_FORMAT",contextStatus:extra.contextStatus||"UNKNOWN"
  });

  lines.forEach((raw,idx)=>{
    if(schema&&idx===schema.lineIndex)return;
    const rowCells=schema&&idx>schema.lineIndex&&raw.includes(schema.delimiter)?splitDelimited(raw,schema.delimiter):null;
    const zipCell=rowCells?(rowCells[schema.zipIndex]??""):null;
    const lineNo=idx+1;const line=(zipCell??raw).trim();if(!line)return;
    const consumed=[];
    // An explicit ZIP column owns extraction; adjacent records and numeric
    // columns must not supply geography or state evidence for this record.
    const context=rowCells?raw:contextWindow(lines,idx,2);
    const state=stateEvidence(raw)||(!rowCells?stateEvidence(context):null);
    const foreign=foreignEvidence(raw)||(!rowCells?foreignEvidence(context):null);
    const explicitZip=Boolean(rowCells)||ZIP_LABEL_RE.test(context);
    const negative=NEGATIVE_LABEL_RE.test(line)&&!ZIP_LABEL_RE.test(line);
    const urlish=URLISH_RE.test(line);const copyright=COPYRIGHT_RE.test(line);

    // 5+5 ranges first. Never expand here.
    RANGE_RE.lastIndex=0;let m;
    while((m=RANGE_RE.exec(line))){
      const start=m.index,end=m.index+m[0].length;consumed.push([start,end]);
      const obj={token:m[0],rawRange:m[0],startZip:m[1],endZip:m[2],line:lineNo,raw,rangeStatus:"RANGE_FORMAT",expandedZipCount:0,reason:"ZIP range detected; not expanded automatically."};
      ranges.push(obj);review.push(reasonItem(m[0],lineNo,raw,obj.reason,{kind:"RANGE",startZip:m[1],endZip:m[2]}));
    }

    // Foreign 5+3 postal before ZIP+4 / ZIP5.
    FOREIGN_5_3_RE.lastIndex=0;
    while((m=FOREIGN_5_3_RE.exec(line))){
      const start=m.index,end=m.index+m[0].length;consumed.push([start,end]);
      nonUs.push(reasonItem(m[0],lineNo,raw,"Foreign-style 5+3 postal token; excluded from U.S. ZIP ranking.",{kind:"NON_US_POSTAL"}));
    }

    ZIP4_RE.lastIndex=0;
    while((m=ZIP4_RE.exec(line))){
      const start=m.index,end=m.index+m[0].length;if(consumed.some(([a,b])=>start>=a&&end<=b))continue;consumed.push([start,end]);
      const before=line[start-1]||"",after=line[end]||"";
      if(/[A-Za-z]/.test(before)||/[A-Za-z]/.test(after)){review.push(reasonItem(m[0],lineNo,raw,"ZIP+4 touches letters; review before lookup.",{kind:"ZIP4"}));continue}
      if(foreign&&!state&&!explicitZip){review.push(reasonItem(m[0],lineNo,raw,"ZIP+4 shape appears inside foreign-only context; review before U.S. lookup.",{kind:"ZIP4",warningCodes:["FOREIGN_CONTEXT"]}));continue}
      addOccurrence(m[1],lineNo,raw,m[0],{formatStatus:"VALID_ZIP4_FORMAT",sourceContext:context,sourceState:state?.abbr||null,sourceCountry:foreign?.label||"US",contextStatus:foreign&&state?"CONFLICT":state?"AGREES":"UNKNOWN",warningCodes:foreign&&state?["SOURCE_COUNTRY_CONFLICT"]:[]});
      occurrences.at(-1).plus4=m[2];
    }

    // O/0 OCR candidate - never auto-fix.
    const oRe=/(?:^|[^A-Za-z0-9])([Oo]\d{4})(?=$|[^A-Za-z0-9])/g;
    while((m=oRe.exec(line)))review.push(reasonItem(m[1],lineNo,raw,"Possible O→0 transcription issue — not auto-converted.",{kind:"OCR"}));

    ZIP5_RE.lastIndex=0;
    while((m=ZIP5_RE.exec(line))){
      const start=m.index,end=start+5,zip=m[1];if(consumed.some(([a,b])=>start>=a&&end<=b))continue;
      const before=line[start-1]||"",after=line[end]||"";
      if(/\d/.test(before)||/\d/.test(after)){ignored.push(reasonItem(zip,lineNo,raw,"Embedded in a longer numeric identifier.",{kind:"LONG_NUMBER"}));continue}
      if(/[A-Za-z]/.test(before)||/[A-Za-z]/.test(after)){review.push(reasonItem(zip,lineNo,raw,"Digits touch letters; review before lookup.",{kind:"ATTACHED_TEXT"}));continue}
      if(after==="%"||before==="$"||after==="$" ){ignored.push(reasonItem(zip,lineNo,raw,"Numeric value is currency/percentage-like, not ZIP geography.",{kind:"NUMERIC_NOISE"}));continue}
      if(zip==="00000"){invalid.push(reasonItem(zip,lineNo,raw,"Placeholder ZIP; never ranking eligible.",{kind:"PLACEHOLDER"}));continue}
      if(negative&&zipCell!==zip){ignored.push(reasonItem(zip,lineNo,raw,"Five digits appear under a non-geographic label.",{kind:"NEGATIVE_LABEL"}));continue}
      if(urlish&&!explicitZip&&!state){review.push(reasonItem(zip,lineNo,raw,"Five digits appear in a URL/path; geography meaning is not established.",{kind:"URL_CONTEXT"}));continue}
      if(copyright&&!explicitZip&&!state){review.push(reasonItem(zip,lineNo,raw,"Five digits appear next to copyright text; shape alone does not confirm a ZIP.",{kind:"COPYRIGHT_CONTEXT"}));continue}
      if(foreign&&!state&&!explicitZip&&zipCell!==zip){review.push(reasonItem(zip,lineNo,raw,"Five digits appear in foreign-only context; U.S. ZIP meaning needs independent support.",{kind:"FOREIGN_CONTEXT"}));continue}
      const warningCodes=[];let contextStatus="UNKNOWN";
      if(foreign&&state){warningCodes.push("SOURCE_COUNTRY_CONFLICT");contextStatus="CONFLICT"}
      else if(state){contextStatus="AGREES"}
      addOccurrence(zip,lineNo,raw,zip,{sourceContext:context,sourceState:state?.abbr||null,sourceCountry:foreign?.label||null,contextStatus,warningCodes,classification:(explicitZip||state||zipCell===zip)?"CONFIRMED":"LIKELY"});
    }

    // Context-aware 3/4 digit normalization: only explicit ZIP field + state evidence.
    SHORT_ZIP_RE.lastIndex=0;
    while((m=SHORT_ZIP_RE.exec(line))){
      const start=m.index,end=start+m[1].length;if(consumed.some(([a,b])=>start>=a&&end<=b))continue;
      const token=m[1];
      if(/\d/.test(line[start-1]||"")||/\d/.test(line[end]||""))continue;
      if(/%/.test(line.slice(Math.max(0,start-1),Math.min(line.length,end+1))))continue;
      if(!state||!explicitZip){
        if(token.length===4&&!/\//.test(line))review.push(reasonItem(token,lineNo,raw,"Short numeric token is not silently padded without explicit ZIP + state context.",{kind:"SHORT_ZIP"}));
        continue;
      }
      const padded=token.padStart(5,"0");
      if(!shortZipAllowed(state.abbr,padded)){review.push(reasonItem(token,lineNo,raw,`Explicit ZIP context exists, but ${padded} does not fit the conservative ${state.abbr} leading-zero rule.`,{kind:"SHORT_ZIP"}));continue}
      addOccurrence(padded,lineNo,raw,token,{sourceContext:context,sourceState:state.abbr,sourceCountry:null,contextStatus:"AGREES",classification:"CONFIRMED",normalization:{from:token,to:padded,reason:`Explicit ZIP label + ${state.abbr} context`},warningCodes:["NORMALIZED_LEADING_ZERO"]});
    }
  });

  // Aggregate source occurrences into unique ZIP results without destroying lineage.
  const byZip=new Map();
  for(const occ of occurrences){
    if(!byZip.has(occ.zip))byZip.set(occ.zip,{zip:occ.zip,line:occ.line,raw:occ.raw,original:occ.original,occurrences:0,lines:[],occurrenceIds:[],originalRepresentations:[],sourceContexts:[],sourceStates:[],sourceCountries:[],warnings:[],status:"ready",classification:occ.classification,formatStatus:occ.formatStatus,contextStatus:occ.contextStatus});
    const u=byZip.get(occ.zip);u.occurrences++;u.lines.push(occ.line);u.occurrenceIds.push(occ.occurrenceId);u.originalRepresentations.push(occ.original);if(occ.sourceContext)u.sourceContexts.push(occ.sourceContext);if(occ.sourceState)u.sourceStates.push(occ.sourceState);if(occ.sourceCountry)u.sourceCountries.push(occ.sourceCountry);u.warnings.push(...occ.warningCodes);if(occ.contextStatus==="CONFLICT")u.contextStatus="CONFLICT";if(occ.normalization)u.normalization=occ.normalization;
  }
  const ready=[...byZip.values()].map(u=>({...u,lines:[...new Set(u.lines)],occurrenceIds:[...new Set(u.occurrenceIds)],originalRepresentations:[...new Set(u.originalRepresentations)],sourceStates:[...new Set(u.sourceStates)],sourceCountries:[...new Set(u.sourceCountries)],warnings:[...new Set(u.warnings)]}));

  return {
    rawInput,lineCount:lines.length,detectedStructures:structures,headerSchema:schema,
    occurrences,ready,review,ignored,ranges,invalid,nonUs,
    summary:{inputLines:lines.length,zipOccurrences:occurrences.length,uniqueZips:ready.length,review:review.length,invalid:invalid.length,nonUsPostal:nonUs.length,ranges:ranges.length,contextConflicts:ready.filter(x=>x.contextStatus==="CONFLICT").length,normalized:ready.filter(x=>x.normalization).length}
  };
}
