function exportLocationLabel(r){return r?.resolvedPlaceLabel||r?.postalLocation?.label||r?.geography||`ZCTA ${r?.zip||""}`}
export function makeCsv(rows,meta){
 const esc=v=>{let s=String(v??"");if(/^[\s]*[=+@-]/.test(s))s="'"+s;return `"${s.replaceAll('"','""')}"`};
 const headers=["Rank","ZIP","Place / State","Median Household Income","Margin of Error","Occurrences","Geography Status","ZCTA Status","ACS Status","Context Status","Lookup Status","ZCTA","ACS Vintage","Metric","Retrieved At","Source Mode","Income Provider","Postal Label Provider","Warnings","Source Lines"];
 const lines=[headers.map(esc).join(",")];
 rows.forEach(r=>lines.push([r.rank??"",r.zip,exportLocationLabel(r),r.estimate??"",r.moe??"",r.occurrenceCount??r.occurrences??1,r.geographyStatus||"",r.zctaStatus||"",r.acsStatus||"",r.contextStatus||"",r.lookupStatus||"",r.zcta||"",r.acsVintage||meta.year||"2024",r.metricId||"B19013_001E",r.retrievalDate||meta.retrievedAt||"",r.sourceMode||meta.sourceMode||"PINNED_RELAY",meta.provider||"Census Reporter",meta.locationProvider||"Zippopotam.us",(r.warnings||[]).join(" | "),(r.sourceLines||[]).join(" | ")].map(esc).join(",")));
 return lines.join("\r\n");
}
export function makeTxt(rows,meta){
 const body=rows.map(r=>`${r.rank==null?"--":String(r.rank).padStart(2,"0")}  ${r.zip}  ${r.estimate==null?"Unavailable":formatMoney(r.estimate)}  ${exportLocationLabel(r)}  [${r.occurrenceCount??1} occurrence${(r.occurrenceCount??1)===1?"":"s"}]\n    MOE: ${r.moe==null?"Unavailable":formatMoney(r.moe)} | ZCTA: ${r.zcta||"No match"} | Geography: ${r.geographyStatus||"UNKNOWN"} | ACS: ${r.acsStatus||"UNKNOWN"} | Context: ${r.contextStatus||"UNKNOWN"} | Lookup: ${r.lookupStatus||"UNKNOWN"}\n    Source lines: ${(r.sourceLines||[]).join(", ")||"—"} | Warnings: ${(r.warnings||[]).join(", ")||"None"}`).join("\n");
 return `JACKZIP\n2024 ACS 5-Year • B19013 ZCTA median household income\nEstimate: B19013_001E • MOE: B19013_001M\nIncome data: U.S. Census Bureau ACS via ${meta.provider||"Census Reporter"} • mode ${meta.sourceMode||"PINNED_RELAY"}\nPostal labels: ${meta.locationProvider||"Zippopotam.us"}\nRetrieved: ${meta.retrievedAt||""}\n\n${body}\n`;
}
export function downloadText(text,filename,type="text/plain"){const blob=new Blob([text],{type:`${type};charset=utf-8`});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),750)}
export function formatMoney(n){return Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"Unavailable"}
