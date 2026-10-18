import test from "node:test";
import assert from "node:assert/strict";
import {parseRequirements,analyzeApplication,buildApplicationKitPrompt,generateApplicationKit} from "../public/application-kit.js";
const profile={name:"Ana",headline:"Soporte",targetRoles:["Customer Success"],skills:["CRM","Salesforce","Atención al cliente"],languages:["Inglés"]};
const job={title:"Customer Success",company:"Ejemplo",source:"Tablero público",url:"https://example.org/job/123"};
test("parse requirements deduplicates and caps",()=>{
 assert.deepEqual(parseRequirements("• Salesforce\n- Salesforce\n1. Python\n2) Inglés"),["Salesforce","Python","Inglés"]);
 assert.equal(parseRequirements("Análisis;".repeat(40)).length,1);
 assert.equal(parseRequirements(Array.from({length:40},(_,i)=>"Requisito "+i).join(";")).length,16);
});
test("evidence only from declared skills; unverified not missing",()=>{
 const a=analyzeApplication({profile,job,requirements:"Salesforce\nPython\nInglés"});
 assert.equal(a.known.length,2);assert.equal(a.unknown.length,1);
 assert.equal(a.unknown[0].requirement,"Python");
 assert.match(a.caution,/NO certificación/);
});
test("prompt uses only explicit evidence and treats vacancy as untrusted",()=>{
 const p=buildApplicationKitPrompt({profile,job,requirements:"Python\nSalesforce",experience:"Atendí clientes por chat"});
 assert.equal(p.length,2);assert.match(p[0].content,/No inventes/);
 assert.match(p[0].content,/NO CONFIABLE/);assert.match(p[1].content,/Atendí clientes/);
});
test("OpenRouter free request directly, no Worker and no paid fallback",async()=>{
 const req=[];
 const response=await generateApplicationKit({apiKey:"sk-or-test",profile,job,requirements:"Salesforce",fetchImpl:async(url,options)=>{
   req.push({url,body:JSON.parse(options.body)});
   return {ok:true,json:async()=>({choices:[{message:{content:"Borrador"}}]})};
 }});
 assert.equal(response,"Borrador");assert.equal(req.length,1);
 assert.equal(req[0].url,"https://openrouter.ai/api/v1/chat/completions");
 assert.equal(req[0].body.model,"openrouter/free");
});
test("no key/requirements means no call; rate limit does not retry",async()=>{
 let count=0;
 const fetchImpl=async()=>{count++;return{ok:false,status:429,json:async()=>({error:{message:"Quota reached"}})}};
 await assert.rejects(generateApplicationKit({apiKey:"",profile,job,requirements:"CRM",fetchImpl}),/NOT_CONNECTED/);
 await assert.rejects(generateApplicationKit({apiKey:"key",profile,job,requirements:"",fetchImpl}),/REQUISITOS_NECESARIOS/);
 assert.equal(count,0);
 await assert.rejects(generateApplicationKit({apiKey:"key",profile,job,requirements:"CRM",fetchImpl}),/Quota reached/);
 assert.equal(count,1);
});
