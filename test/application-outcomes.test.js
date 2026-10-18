import {test} from "node:test";
import assert from "node:assert/strict";
import {createOutcomeStore,followUpState,OUTCOME_KEY} from "../public/application-outcomes.js";
import {SPECIALTIES,specialtiesForJob,matchesSpecialty} from "../public/specialties.js";
function storage(){const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const job={id:"job-123",title:"Evaluadora de IA",company:"Test"};
test("outcomes default is preparing; does not claim contact or submission",()=>{
 const s=createOutcomeStore(storage());assert.equal(s.get(job).stage,"preparing");assert.equal(s.get(job).contactDate,"");assert.deepEqual(s.all(),{});
});
test("contact requires deliberate manual status and preserves date/notes through reload",()=>{
 const db=storage();const first=createOutcomeStore(db);
 const record=first.save(job,{stage:"contacted",contactDate:"2026-10-01",notes:"Mandé CV por email"});
 assert.equal(record.stage,"contacted");assert.equal(record.contactDate,"2026-10-01");
 assert.equal(createOutcomeStore(db).get(job).notes,"Mandé CV por email");
 assert.equal(JSON.parse(db.getItem(OUTCOME_KEY))["job-123"].stage,"contacted");
});
test("future or invalid contact dates rejected, no inferred submission",()=>{
 const st=createOutcomeStore(storage());
 assert.throws(()=>st.save(job,{stage:"contacted",contactDate:"2027-02-30"}),/INVALID_CONTACT_DATE/);
 assert.throws(()=>st.save(job,{stage:"contacted",contactDate:"2099-01-01"}),/INVALID_CONTACT_DATE/);
 assert.throws(()=>st.save(job,{stage:"sent",contactDate:""}),/INVALID_APPLICATION_STAGE/);
 assert.equal(st.get(job).stage,"preparing");
});
test("follow-up only prompts after 10 days and only when date supplied",()=>{
 const now=new Date("2026-10-19T15:00:00Z");
 assert.equal(followUpState({stage:"preparing",contactDate:"2026-10-01"},now).due,false);
 assert.equal(followUpState({stage:"contacted",contactDate:""},now).due,false);
 assert.equal(followUpState({stage:"contacted",contactDate:"2026-10-10"},now).due,false);
 assert.equal(followUpState({stage:"contacted",contactDate:"2026-10-09"},now).due,true);
});
test("no malformed or prototype pollution data accepted",()=>{
 const db=storage();db.setItem(OUTCOME_KEY,"{garbage");
 const st=createOutcomeStore(db);assert.deepEqual(st.all(),{});
 assert.throws(()=>st.save({}, {stage:"preparing"}),/OPPORTUNITY_ID_MISSING/);
});
test("specialty classification is bounded and explicit; does not overmatch generic roles",()=>{
 assert.equal(SPECIALTIES["ai-training"],"Entrenamiento IA");
 assert.deepEqual(specialtiesForJob({title:"Customer success",description:"Training for team"}),[]);
 assert.ok(matchesSpecialty({title:"LLM evaluator"},"ai-evaluation"));
 assert.ok(matchesSpecialty({title:"Data annotation specialist"},"data-annotation"));
 assert.ok(matchesSpecialty({title:"AI trainer"},"ai-training"));
 assert.ok(matchesSpecialty({title:"Spanish transcriptionist"},"transcription"));
 assert.equal(matchesSpecialty({title:"Digital marketing manager"},"ai-evaluation"),false);
 assert.equal(matchesSpecialty({title:"Digital marketing manager"},""),true);
});
