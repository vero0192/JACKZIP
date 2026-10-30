// Postal representative points, not ZIP boundaries or device locations.
export function validPoint(row){
  const p=row?.postalLocation;
  return p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
}
export function renderGeoMap(container,rows,onSelect){
  container.replaceChildren();
  const points=rows.filter(validPoint);
  const note=document.createElement('p');note.className='map-note';
  note.textContent=`${points.length} of ${rows.length} results have coordinates. Postal representative points from GeoNames via Zippopotam.us; not ZIP boundaries or your location.`;
  container.append(note);
  if(!points.length)return;
  const NS='http://www.w3.org/2000/svg';
  const node=(tag,attrs,text)=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text)el.textContent=text;return el};
  const svg=node('svg',{viewBox:'0 0 900 450',role:'img','aria-label':'Geographic distribution of current ZIP results'});
  // Auto-fit the extent, with minimum spans so single results remain legible.
  const lons=points.map(r=>r.postalLocation.longitude),lats=points.map(r=>r.postalLocation.latitude);
  let left=Math.min(...lons),right=Math.max(...lons),bottom=Math.min(...lats),top=Math.max(...lats);
  const padX=Math.max(2,(right-left)*.12),padY=Math.max(2,(top-bottom)*.15);
  left-=padX;right+=padX;bottom-=padY;top+=padY;
  const x=v=>60+(v-left)/(right-left)*780,y=v=>390-(v-bottom)/(top-bottom)*330;
  for(let i=0;i<=5;i++){
    const lon=left+(right-left)*i/5,lat=bottom+(top-bottom)*i/5;
    svg.append(node('line',{x1:x(lon),y1:45,x2:x(lon),y2:390,stroke:'#27313A'}),node('text',{x:x(lon),y:420,fill:'#a7b1ab','text-anchor':'middle','font-size':14},`${lon.toFixed(1)}°`));
    svg.append(node('line',{x1:60,y1:y(lat),x2:840,y2:y(lat),stroke:'#27313A'}),node('text',{x:52,y:y(lat)+5,fill:'#a7b1ab','text-anchor':'end','font-size':14},`${lat.toFixed(1)}°`));
  }
  const groups=new Map();
  for(const row of points){
    const {latitude,longitude}=row.postalLocation;
    const g=node('g',{});g.append(node('circle',{cx:x(longitude),cy:y(latitude),r:6,fill:'#DFFF4F'}),node('title',{},`${row.zip}: ${latitude}, ${longitude}`));svg.append(g);groups.set(row.zip,g);
  }
  container.append(svg);
  const list=document.createElement('div');list.className='map-results';
  for(const row of points){const button=document.createElement('button');button.type='button';button.textContent=`${row.zip} · ${row.resolvedPlaceLabel||'Postal point'}`;
    button.addEventListener('focus',()=>groups.get(row.zip).firstChild.setAttribute('r','11'));
    button.addEventListener('blur',()=>groups.get(row.zip).firstChild.setAttribute('r','6'));
    button.addEventListener('click',()=>onSelect(row.zip));list.append(button)}
  container.append(list);
}
