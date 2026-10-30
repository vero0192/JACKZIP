function moneyValue(token){
  if(token==null)return null;
  const raw=String(token).toLowerCase().replace(/[$,\s]/g,"");
  const m=raw.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if(!m)return null;
  let n=Number(m[1]);
  if(m[2]==="k")n*=1_000;
  if(m[2]==="m")n*=1_000_000;
  return Number.isFinite(n)?n:null;
}

export function parseCommand(question){
  const q=String(question||"").trim().toLowerCase();
  if(!q)return {type:"highest",label:"HIGHEST FOUND_"};

  const compare=[...q.matchAll(/\b\d{5}\b/g)].map(x=>x[0]);
  if(/\b(compare|versus|vs\.?)\b/.test(q)&&compare.length>=2)
    return {type:"compare",zips:[...new Set(compare)],label:"COMPARISON_"};

  const between=q.match(/\bbetween\s+\$?([\d,.]+(?:k|m)?)\s+(?:and|to)\s+\$?([\d,.]+(?:k|m)?)/i);
  if(between){
    const a=moneyValue(between[1]),b=moneyValue(between[2]);
    if(a!=null&&b!=null)return {type:"between",min:Math.min(a,b),max:Math.max(a,b),label:"IN RANGE_"};
  }
  const above=q.match(/\b(?:above|over|greater than|more than)\s+\$?([\d,.]+(?:k|m)?)/i);
  if(above){const value=moneyValue(above[1]);if(value!=null)return {type:"above",value,label:`ABOVE ${formatShort(value)}_`}}
  const below=q.match(/\b(?:below|under|less than)\s+\$?([\d,.]+(?:k|m)?)/i);
  if(below){const value=moneyValue(below[1]);if(value!=null)return {type:"below",value,label:`BELOW ${formatShort(value)}_`}}

  const copyTop=q.match(/\bcopy\s+(?:the\s+)?top\s+(\d+)\b/);
  if(copyTop)return {type:"top",count:Math.max(1,Math.min(Number.MAX_SAFE_INTEGER,Number(copyTop[1]))),copyAfter:true,label:`TOP ${copyTop[1]}_`};
  const top=q.match(/\btop\s+(\d+)\b/);
  if(top)return {type:"top",count:Math.max(1,Math.min(Number.MAX_SAFE_INTEGER,Number(top[1]))),label:`TOP ${top[1]}_`};

  if(/\b(lowest|poorest|smallest|min(?:imum)?)\b/.test(q))return {type:"lowest",label:"LOWEST FOUND_"};
  if(/\b(rank all|rank them|all results|highest to lowest|richest to poorest|list all|show all)\b/.test(q))return {type:"all",label:"RANKED ALL_"};
  if(/\b(export all|download all)\b/.test(q))return {type:"all",exportAfter:true,label:"RANKED ALL_"};
  return {type:"highest",label:"HIGHEST FOUND_"};
}

function formatShort(n){
  if(n>=1e6)return `$${(n/1e6).toFixed(n%1e6?1:0)}M`;
  if(n>=1e3)return `$${(n/1e3).toFixed(n%1e3?1:0)}K`;
  return `$${n}`;
}

export function applyCommand(rows,command){
  const usable=[...rows].filter(r=>r.available&&Number.isFinite(r.estimate)).sort((a,b)=>b.estimate-a.estimate||a.zip.localeCompare(b.zip));
  switch(command.type){
    case "highest":return usable.slice(0,1);
    case "lowest":return usable.length?usable.filter(r=>r.estimate===usable.at(-1).estimate).slice(0,1):[];
    case "top":return usable.slice(0,command.count);
    case "above":return usable.filter(r=>r.estimate>command.value);
    case "below":return usable.filter(r=>r.estimate<command.value);
    case "between":return usable.filter(r=>r.estimate>=command.min&&r.estimate<=command.max);
    case "compare":return usable.filter(r=>command.zips.includes(r.zip));
    case "all":default:return usable;
  }
}
