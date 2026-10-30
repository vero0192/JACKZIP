import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'):require('playwright');
const target=new URL(process.argv[2]||'https://vero0192.github.io/JACKZIP/');
assert.equal(target.protocol,'https:','Live smoke check requires HTTPS');
const output=resolve('test-results/live');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,timeout:30000,
  ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
  ...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{}),
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const report={url:target.href,verifiedAt:new Date().toISOString(),browserEngine:'chromium',browser:await browser.version(),checks:[],errors:[],requestFailures:[],providerResponses:[],syntheticNetworkFixtures:false,realDeviceTested:false};
const context=await browser.newContext({viewport:{width:390,height:844}});
context.setDefaultTimeout(30000);
const page=await context.newPage();
page.on('pageerror',error=>report.errors.push(error.message));
page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),reason:request.failure()?.errorText}));
page.on('response',response=>{if(/^https:\/\/api\.(?:censusreporter\.org|zippopotam\.us)\//.test(response.url()))report.providerResponses.push({url:response.url(),status:response.status()})});
function check(label,value){assert.ok(value,label);report.checks.push(label)}
try{
  const response=await page.goto(target.href,{waitUntil:'networkidle',timeout:60000});
  check('Deployed HTTPS app returns HTTP 200',response?.status()===200&&await page.title()==='JACKZIP');
  await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
  check('Deployed mobile layout has no document overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.fill('#sourceInput','03076\n10001\n03076');await page.fill('#askInput','rank all');await page.click('#runBtn');
  await page.waitForFunction(()=>document.querySelector('#flowLive').textContent==='2 RANKED',{},{timeout:90000});
  check('Live providers enrich two ZIPs without retry failures',await page.locator('.rank-row').count()===2&&!(await page.locator('#retryBtn').isVisible()));
  check('Leading-zero ZIP and duplicate lineage survive live lookup',await page.locator('.rank-row[data-zip="03076"]').innerText().then(text=>text.includes('2 occurrences')));
  check('No live geography conflict for bare ZIP list',await page.locator('#unresolvedWrap').evaluate(element=>element.classList.contains('hidden')));
  for(const [button,extension] of [['#csvBtn','csv'],['#txtBtn','txt']]){
    const downloading=page.waitForEvent('download');await page.click(button);const file=await downloading;
    const text=await readFile(await file.path(),'utf8');
    check(`Live ${extension.toUpperCase()} download preserves both ZIPs`,file.suggestedFilename().endsWith('.'+extension)&&text.includes('03076')&&text.includes('10001'));
  }
  await page.click('[data-view="map"]');check('Live postal map shows both coordinates',await page.locator('#mapView circle').count()===2);
  await page.screenshot({path:output+'/mobile-live.png',fullPage:true});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  await page.reload();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);await page.reload();
  check('Deployed service worker serves the app offline',await page.title()==='JACKZIP');
  await page.fill('#sourceInput','03076');await page.waitForFunction(()=>document.querySelector('#readyCount').textContent==='1 ready');
  check('Deployed offline parser preserves leading zeros',await page.inputValue('#sourceInput')==='03076');
  check('No uncaught errors on deployed origin',report.errors.length===0);
}catch(error){report.failure=error.message;throw error}
finally{
  await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));await browser.close();
}
