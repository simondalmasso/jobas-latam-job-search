import test from "node:test";import assert from "node:assert/strict";import{classifyCategory,classifyEngagement,argentinaEligibility,scamAssessment,normalizeMonthlyPay,finalizeJob}from"../src/judge.js";import{parseSalaryText,DISCOVERY_SOURCES,SOURCE_REGISTRY,cleanHtml,safeUrl,normalizePublicationDate,normalizeRemoteLandersJob,normalizeJobicyJob}from"../src/sources.js";
test("categoriza por función principal",()=>{assert.equal(classifyCategory({title:"Customer Success Specialist",description:""}),"customer-success");assert.equal(classifyCategory({title:"Travel Operations Assistant",description:"reservations"}),"travel");assert.equal(classifyCategory({title:"Executive Assistant",description:""}),"admin-va");});
test("Argentina y LatAm primero, restricciones regionales afuera",()=>{assert.equal(argentinaEligibility({location:"Argentina"}).score,100);assert.ok(argentinaEligibility({location:"Latin America"}).score>=90);assert.ok(argentinaEligibility({location:"Worldwide"}).score>=80);assert.ok(argentinaEligibility({location:"US only"}).score<=10);assert.ok(argentinaEligibility({location:"Remote (North America)"}).score<=10);});
test("señales de scam bajan confianza",()=>{const a=scamAssessment({sourceTrust:90,title:"Job",description:"No fees",company:"X"}),b=scamAssessment({sourceTrust:90,title:"Job",description:"Registration fee required, contact Telegram only",company:"X"});assert.ok(a.score>b.score);assert.equal(b.label,"Revisar");});
test("normaliza pagos",()=>{assert.equal(normalizeMonthlyPay({min:10,max:20,period:"hourly"}).monthlyMin,1600);assert.equal(normalizeMonthlyPay({min:12000,max:24000,period:"annual"}).monthlyMax,2000);assert.equal(parseSalaryText("$1,800 - $2,500 per month").monthlyMin,1800);assert.equal(parseSalaryText("Salary Range: USD 2,000–3,500 per month").monthlyMax,3500);assert.equal(Math.round(parseSalaryText("$140k–180k / yr").monthlyMin),11667);assert.equal(parseSalaryText("$140k–180k / yr").monthlyMax,15000);});
test("limpia HTML",()=>assert.equal(cleanHtml("<script>x()</script><p>A &amp; B</p>"),"A & B"));
test("feed no depende de login Google ni Workers AI",()=>{assert.equal(Object.keys(SOURCE_REGISTRY).length,9);assert.ok(DISCOVERY_SOURCES.length>=8);const j=finalizeJob({title:"Customer Support",company:"A",location:"LatAm",description:"chat support",sourceTrust:90,workerFee:false,publishedAt:new Date().toISOString(),pay:normalizeMonthlyPay({min:1000,max:1200,period:"monthly"})});assert.ok(j.qualityScore>70);assert.equal("priority" in j,false);});

test("missing salary is null, never normalized to fabricated zero pay",()=>{
  const p=normalizeMonthlyPay({min:null,max:null,period:"annual",raw:"No publicado"});
  assert.equal(p.monthlyMin,null);
  assert.equal(p.monthlyMax,null);
  assert.equal(finalizeJob({title:"Analyst",company:"Example",location:"Argentina",sourceTrust:90,pay:p}).qualityComponents.compensationTransparency,45);
});
test("explicit Argentina exclusions override worldwide marketing copy",()=>{
  const r=argentinaEligibility({title:"Support",location:"Worldwide",description:"Remote worldwide except Argentina"});
  assert.equal(r.label,"No compatible");
});

test("WeRemoto HTML-escaped application URLs preserve real query parameters",()=>{
  const href=safeUrl("https://ar.talent.com/redirect?bpid=42&amp;falcon=1&amp;id=123");
  assert.equal(new URL(href).searchParams.get("bpid"),"42");
  assert.equal(new URL(href).searchParams.get("falcon"),"1");
  assert.equal(new URL(href).searchParams.get("id"),"123");
  assert.doesNotMatch(href,/&amp;/);
  assert.equal(safeUrl("javascript:alert(1)"),"");
});

test("source-declared engagement types distinguish freelance, contract and employee jobs",()=>{
  assert.equal(classifyEngagement({employmentType:"Contractor"}).engagementType,"contract");
  assert.equal(classifyEngagement({engagementType:"contract"}).engagementEvidence,"inferred");
  assert.equal(classifyEngagement({jobType:["Freelance"]}).engagementType,"freelance");
  assert.equal(classifyEngagement({title:"Freelance UX Writer"}).engagementType,"freelance");
  assert.equal(classifyEngagement({title:"Software Engineer (Contract)"}).engagementType,"contract");
  assert.equal(classifyEngagement({title:"Full-Time Support Specialist"}).engagementType,"employment");
  assert.equal(classifyEngagement({title:"Customer Support Specialist"}).engagementType,"unknown");
});
test("Himalayas epoch-second dates normalize correctly instead of appearing expired",()=>{
  assert.equal(normalizePublicationDate(1792242011),"2026-10-17T13:00:11.000Z");
  assert.equal(normalizePublicationDate("1792242011"),"2026-10-17T13:00:11.000Z");
});
test("Remote Landers contract adapter preserves attribution, original listing link and hourly range",()=>{
  const job=normalizeRemoteLandersJob({
    slug:"python-ai-contract",title:"Python Senior Software Engineer, AI Training",company:"G2I",
    type:"Contract",location:"Not stated",category:"Engineering",subtags:["AI Training"],
    postedDate:"2026-10-17",salary:"$100–200 / hr",
    url:"https://remotelanders.com/remote-jobs/python-ai-contract"
  });
  assert.equal(job.sourceName,"Remote Landers");
  assert.equal(job.engagementType,"contract");
  assert.equal(job.engagementEvidence,"source");
  assert.equal(job.url,"https://remotelanders.com/remote-jobs/python-ai-contract");
  assert.equal(job.pay.monthlyMin,16000);
  assert.equal(job.pay.monthlyMax,32000);
  assert.equal(job.publishedAt,"2026-10-17T00:00:00.000Z");
  assert.equal(job.argentina.label,"A verificar");
  assert.match(job.description,/confirmarla antes de postular/);
});

test("explicit country restrictions override LATAM keywords in title or description",()=>{
  const restricted=argentinaEligibility({
    title:"Freelance Transcribers - Multiple Languages (EU, AU & LATAM)",
    location:"France",locationRestrictions:["France"],
    description:"Remote project with opportunities in LATAM"
  });
  assert.equal(restricted.score,5);
  assert.equal(restricted.label,"No compatible");
  const ambiguous=argentinaEligibility({title:"Assistant Property Manager",location:"🇨🇴 Colombia",description:"LATAM experience preferred"});
  assert.equal(ambiguous.score,48);
  assert.equal(ambiguous.label,"A verificar");
  const accepted=argentinaEligibility({location:"France",locationRestrictions:["France","Argentina"],description:"EU, AU & LATAM"});
  assert.equal(accepted.score,100);
});

test("automatic source registry remains aligned with scheduled source-call metadata",()=>{
  assert.equal(Object.keys(SOURCE_REGISTRY).length,9);
});

test("de/Recruiters is manual-only and is not treated as an automated feed",()=>{
  const source=DISCOVERY_SOURCES.find(item=>item.name==="de/Recruiters");
  assert.ok(source);
  assert.equal(source.url,"https://www.derecruiters.com/#jobs");
  assert.match(source.note,/manual/i);
  assert.match(source.note,/proh[ií]ben scraping/i);
  assert.equal(SOURCE_REGISTRY.derecruiters,undefined);
});

test("Jobicy uses current salaryMin/salaryMax and salaryPeriod fields",()=>{
  const job=normalizeJobicyJob({
    id:155612,jobTitle:"Pain Consultant (Remote, Ireland)",companyName:"Montu UK",
    jobType:["Contract"],jobGeo:"Ireland",salaryMin:110,salaryMax:150,
    salaryCurrency:"EUR",salaryPeriod:"hourly",pubDate:"2026-10-17T14:08:46+00:00",
    url:"https://jobicy.com/jobs/155612-pain-consultant-remote-ireland"
  });
  assert.equal(job.engagementType,"contract");
  assert.equal(job.pay.currency,"EUR");
  assert.equal(job.pay.monthlyMin,17600);
  assert.equal(job.pay.monthlyMax,24000);
  assert.equal(job.pay.estimateBasis,"160 h/mes");
  assert.equal(job.url,"https://jobicy.com/jobs/155612-pain-consultant-remote-ireland");
});
