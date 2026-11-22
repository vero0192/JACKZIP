import assert from "node:assert/strict";
import {extractZipCandidates,detectSensitiveInput} from "./parser.js";
const z=s=>extractZipCandidates(s);

const messy=`ZIP\nInfo\nAddress\nBIN\nInfo\nBase\nValid %\nide\n70770\ninfo\n\ntype\nbase\n90%\noria\n61604\ninfo\n\ntype\nbase\n90%\npunt\n37122\nliet\ninfo\n\ntype\nbase\n90%\ngeles\n90008\ninfo\n\ntype\nbase\n90%\nham\n03076\ninfo\n.. ..\n\ntype\nbase\n90%\ndio\n92201\ninfo\n\ntype\nbase\n90%\nigboro\n45066\ninfo\n\ntype\nbase\n90%\n'eland\n37312\n90%`;
assert.deepEqual(z(messy).ready.map(x=>x.zip),["70770","61604","37122","90008","03076","92201","45066","37312"]);

// Golden / adversarial parser locks.
assert.equal(z("Pelham NH 03076").ready[0].zip,"03076");
assert.equal(z("454951 07/2031 PR Puerto Rico Juncos 00777").ready.some(x=>x.zip==="00777"),true);
assert.equal(z("454951 07/2031 PR Puerto Rico Juncos 00777").ready.some(x=>x.zip==="45495"||x.zip==="54951"),false);
assert.equal(z("BR São Paulo Sorocaba 18051-130").ready.length,0);assert.equal(z("BR São Paulo Sorocaba 18051-130").nonUs.length,1);
assert.equal(z("AU South Australia Adelaide 5000").ready.length,0);
assert.equal(z("Freeport 00000").ready.length,0);assert.equal(z("Freeport 00000").invalid[0].token,"00000");
assert.equal(z("South Yorkshire TBC TBC").ready.length,0);
assert.equal(z("GB Florida Miami 33170").ready[0].zip,"33170");assert.equal(z("GB Florida Miami 33170").ready[0].contextStatus,"CONFLICT");
assert.equal(z("03076\n03076\nZIP:03076").ready[0].occurrences,3);
assert.equal(z("10001-1234").ready[0].zip,"10001");assert.equal(z("10001-1234").occurrences[0].plus4,"1234");
assert.equal(z("35001-36999").ready.length,0);assert.equal(z("35001-36999").ranges.length,1);
assert.deepEqual(z("City\nZIP\nInfo\n\nPelham\n03076\ninfo\n\nIndio\n92201\ninfo").ready.map(x=>x.zip),["03076","92201"]);
assert.equal(z("Order ID 123456789012").ready.length,0);
assert.equal(z("04/2034").ready.length,0);
assert.equal(z("90%\n23.9$").ready.length,0);
assert.equal(z("ZIP: (03076)").ready[0].zip,"03076");
assert.equal(z("Pelham, NH 03076, USA").ready[0].zip,"03076");
assert.equal(z("New York, NY 10001-1234").ready[0].zip,"10001");
assert.deepEqual(z("03076 92201").ready.map(x=>x.zip),["03076","92201"]);
assert.equal(z("https://example.com/item/12345/details").ready.length,0);assert.ok(z("https://example.com/item/12345/details").review.some(x=>x.token==="12345"));
assert.equal(z("Copyright 20245").ready.length,0);assert.ok(z("Copyright 20245").review.some(x=>x.token==="20245"));
assert.equal(z("city,state,zip\nPelham,NH,03076").ready[0].zip,"03076");
assert.equal(z("city,state,zip\nPelham,NH,").ready.length,0);
// Explicit ZIP columns isolate geography from other numeric fields and records.
const table=z('city,state,zip,order\nPelham,NH,03076,12345\nNew York,NY,10001,67890');
assert.deepEqual(table.ready.map(r=>r.zip),['03076','10001']);
assert.deepEqual(table.ready.map(r=>r.sourceStates),[['NH'],['NY']]);
assert.deepEqual(table.ready.map(r=>r.lines),[[2],[3]]);
assert.equal(z('city,state,zip,order\nPelham,NH,,12345').ready.length,0);
assert.equal(z('city,state,zip\nPelham,NH').ready.length,0);
assert.deepEqual(z('"city","state","zip","order"\n"Pelham, district",NH,"03076",12345').ready.map(r=>r.zip),['03076']);
assert.deepEqual(z('"city","state","zip","order"\n"A ""quoted"" place",NY,"00501",12345').ready.map(r=>r.zip),['00501']);
assert.deepEqual(z('city\tstate\tzip\torder\nPelham\tNH\t03076\t12345').ready.map(r=>r.zip),['03076']);
assert.deepEqual(z('city;state;zip;order\nPelham;NH;03076;12345').ready.map(r=>r.zip),['03076']);
assert.deepEqual(z('city|state|zip|order\nPelham|NH|03076|12345').ready.map(r=>r.zip),['03076']);
assert.deepEqual(z('city,state,zip,order\nPelham,NH,3076,12345').ready.map(r=>r.zip),['03076']);
assert.deepEqual(z('city,state,zip\nPelham,NH,03076\nNew York,NY,03076').ready[0].sourceStates,['NH','NY']);
assert.deepEqual(z('Pelham NH 03076\nNew York NY 10001').ready.map(r=>r.sourceStates),[['NH'],['NY']]);
assert.equal(z("10001-1111\n10001-2222").ready[0].occurrences,2);
const mixedForeign=z("Sorocaba 18051-130\nPelham NH 03076\nAdelaide 5000");assert.deepEqual(mixedForeign.ready.map(x=>x.zip),["03076"]);assert.equal(mixedForeign.nonUs.length,1);
assert.equal(z("10001-1234\n35001-36999").ready[0].zip,"10001");assert.equal(z("10001-1234\n35001-36999").ranges.length,1);
assert.equal(z("Pelham           NH               03076").ready[0].zip,"03076");
assert.equal(z("Pelham\tNH\t03076").ready[0].zip,"03076");
assert.equal(z("Pelham|NH|03076").ready[0].zip,"03076");
assert.equal(z("Pelham NH 03076\nUnknown Place NH 03076").ready[0].occurrences,2);
assert.equal(z("Account: 030761234567").ready.length,0);
assert.equal(z("BR|SP|Sorocaba|18051-130|03076").ready.length,0);

// Current safe normalization / OCR policy.
assert.equal(z("Maine ZIP 3091").ready[0].zip,"03091");assert.equal(z("Maine ZIP 3091").ready[0].normalization.from,"3091");
assert.equal(z("New York ZIP 501").ready[0].zip,"00501");
assert.equal(z("3076").ready.length,0);assert.equal(z("3076").review.length,1);
assert.equal(z("O3076").ready.length,0);assert.ok(z("O3076").review.some(x=>/O→0/.test(x.reason)));
assert.equal(z("abc37122").ready.length,0);assert.equal(z("abc37122").review[0].token,"37122");
assert.equal(z("90008%").ready.length,0);
assert.equal(z("Pelham (03076)").ready[0].zip,"03076");

// Mixed-input regression: source identifiers must not masquerade as ZIP geography.
const chaotic=z([
  "Order #482910 | Customer A | $450.66",
  "Pelham NH 03076 - shipment delivered",
  "Phone: 212-555-0198",
  "Account 9834561823 | ref 72910",
  "Brooklyn NY 11211 | Qty 12 | $89.95",
  "Nashville Tennessee 37211",
  "Invoice 45066 / Date 11-22-2026",
  "ZIP: 10001 | New York, NY",
  "Tracking ID 7438291902245"
].join("\n"));
assert.deepEqual(chaotic.ready.map(x=>x.zip),["03076","11211","37211","10001"]);
assert.deepEqual(chaotic.ready.map(x=>x.lines),[[2],[5],[6],[8]]);
assert.ok(chaotic.ignored.some(x=>x.token==="72910"&&x.kind==="NEGATIVE_LABEL"));
assert.ok(chaotic.ignored.some(x=>x.token==="45066"&&x.kind==="NEGATIVE_LABEL"));
assert.equal(chaotic.review.some(x=>x.token==="0198"||x.token==="2026"),false);
assert.deepEqual(z("Invoice 72910 | Pelham NH 03076").ready.map(x=>x.zip),["03076"]);
assert.deepEqual(z("ref 72910 | ZIP: 10001").ready.map(x=>x.zip),["10001"]);
assert.equal(z("Tracking ID 7438291902245").ready.length,0);
assert.equal(z("Phone: 212-555-0198").review.some(x=>x.token==="0198"),false);
assert.equal(z("Date 11-22-2026").review.some(x=>x.token==="2026"),false);

// Safety gate: header labels alone do not block geography; credential/payment evidence does.
assert.equal(detectSensitiveInput("BIN\n03076").blocked,false);
assert.equal(detectSensitiveInput("4111 1111 1111 1111").blocked,true);
assert.equal(detectSensitiveInput("password: swordfish").blocked,true);

console.log("parser tests: PASS (expanded golden/adversarial suite)");
