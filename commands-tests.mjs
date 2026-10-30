import assert from "node:assert/strict";
import {parseCommand,applyCommand} from "./commands.js";
const rows=[
  {zip:"03076",estimate:135956,available:true},
  {zip:"45066",estimate:131250,available:true},
  {zip:"37122",estimate:112967,available:true},
  {zip:"70770",estimate:92311,available:true}
];
assert.equal(parseCommand("what's highest income?").type,"highest");
assert.equal(parseCommand("lowest").type,"lowest");
assert.equal(parseCommand("top 3").count,3);
assert.equal(parseCommand("top 500").count,500);
assert.equal(parseCommand("copy top 5000").count,5000);
assert.equal(applyCommand([{zip:'10002',estimate:100,available:true},{zip:'10001',estimate:100,available:true}],parseCommand('lowest'))[0].zip,'10001');
assert.equal(parseCommand("above 100k").value,100000);
assert.equal(parseCommand("under $100,000").value,100000);
assert.deepEqual(parseCommand("compare 03076 vs 45066").zips,["03076","45066"]);
assert.deepEqual(applyCommand(rows,parseCommand("highest income")).map(x=>x.zip),["03076"]);
assert.deepEqual(applyCommand(rows,parseCommand("lowest")).map(x=>x.zip),["70770"]);
assert.deepEqual(applyCommand(rows,parseCommand("above 120k")).map(x=>x.zip),["03076","45066"]);
assert.deepEqual(applyCommand(rows,parseCommand("between 90k and 120k")).map(x=>x.zip),["37122","70770"]);
console.log("command tests: PASS");
