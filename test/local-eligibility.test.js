import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {loadCuratedFindings} from "../src/index.js";

test("Santa Fe curated jobs explicitly identify Argentina; expired records never stay live",()=>{
  const local=loadCuratedFindings().jobs.filter(job=>job.lane==="LOCAL");
  if(!local.length){
    const raw=JSON.parse(fs.readFileSync("data/curated-local.json","utf8"));
    const notExpired=(raw.findings||[]).filter(job=>!job.expiresAt||Date.parse(job.expiresAt)>=Date.now());
    assert.equal(notExpired.length,0,"active curated records disappeared from the local radar");
    return;
  }
  for(const job of local){
    assert.match(job.location,/Argentina/);
    assert.ok(job.argentina.score>=80,job.id+" was hidden by the local Argentina filter");
  }
});
