const TITLE_RULES = [
  ["data-ai", /ai trainer|ai response|data annotat|data label|evaluator|rlhf|prompt engineer/i],
  ["tech", /developer|engineer|software|devops|cybersecurity|qa\b|programmer|architect/i],
  ["finance", /accountant|accounting|finance|bookkeeper|controller/i],
  ["travel", /travel|reservation|booking|tourism/i],
  ["admin-va", /virtual assistant|executive assistant|administrative assistant|admin assistant|personal assistant/i],
  ["sales", /sales|\bsdr\b|business development|account executive|appointment setter|closer/i],
  ["customer-success", /customer success|client success|customer experience|account manager/i],
  ["support", /customer support|technical support|support specialist|support agent|help desk|helpdesk/i],
  ["marketing", /marketing|media buyer|paid media|growth|seo|sem|demand generation/i],
  ["content-social", /content|social media|community manager|copywriter|video editor|creator/i],
  ["operations", /operations|coordinator|program manager|project manager/i]
];

const BODY_RULES = [
  ["customer-success", /customer success|client success|customer experience|customer lifecycle/i],
  ["support", /customer support|technical support|support specialist|support agent|help desk|helpdesk|chat support/i],
  ["travel", /travel assistant|travel operations|reservations?|booking agent|tourism|travel coordinator/i],
  ["admin-va", /virtual assistant|executive assistant|administrative assistant|admin assistant|personal assistant/i],
  ["operations", /operations|coordinator|project coordinator|business operations|ops coordinator/i],
  ["sales", /sales development|\bsdr\b|business development|account executive|sales representative|appointment setter|closer/i],
  ["marketing", /marketing|media buyer|paid media|growth|seo|sem|performance marketing|demand generation/i],
  ["ecommerce-crm", /e-?commerce|shopify|woocommerce|mercado libre|crm|salesforce|hubspot/i],
  ["content-social", /content|social media|community manager|copywriter|video editor|creator/i],
  ["data-ai", /data annotat|ai trainer|rlhf|prompt|data entry|data labeling|research assistant/i],
  ["tech", /software engineering|software development|devops|cybersecurity|quality assurance|data engineering/i],
  ["finance", /accounting|bookkeeping|financial operations/i]
];

const HIGH_RISK = [
  /registration fee/i,/application fee/i,/training fee/i,/pay.*before.*start/i,/deposit.*required/i,
  /buy.*equipment.*from us/i,/gift card/i,/crypto wallet/i,/telegram only/i,/whatsapp only/i,/send.*money/i,/wire transfer/i
];

const ARGENTINA_NEGATIVE = /us only|usa only|united states only|canada only|europe only|uk only|north america(?: only|\b)|united states(?:,| and) canada|us(?:,| and) canada|must be based in the us|u\.s\. residents only|remote \(us|remote \(usa|remote \(north america/i;

export function classifyCategory(job){
  const title=String(job.title||"");
  for(const [id,rx] of TITLE_RULES)if(rx.test(title))return id;
  const body=String(job.description||"")+" "+(job.tags||[]).join(" ");
  for(const [id,rx] of BODY_RULES)if(rx.test(body))return id;
  return"other";
}

const ENGAGEMENT_LABELS=Object.freeze({
  freelance:"Freelance",
  contract:"Contrato",
  gig:"Microjob / tarea",
  employment:"Relación laboral",
  unknown:"Tipo no indicado"
});
const ENGAGEMENT_TYPES=new Set(Object.keys(ENGAGEMENT_LABELS));

export function classifyEngagement(job={}){
  const known=String(job.engagementType||"").trim().toLowerCase();
  if(ENGAGEMENT_TYPES.has(known)){
    return{
      engagementType:known,
      engagementEvidence:known==="unknown"?"unknown":job.engagementEvidence==="source"?"source":"inferred",
      engagementLabel:ENGAGEMENT_LABELS[known]
    };
  }
  const structured=[job.employmentType,job.jobType].flatMap(v=>Array.isArray(v)?v:[v])
    .filter(Boolean).join(" ").toLowerCase().replace(/[_-]+/g," ");
  let type="";
  if(/\bfreelanc(?:e|er|ing)\b|independent contractor/.test(structured))type="freelance";
  else if(/\bcontractor\b|\bcontract\b|fixed term/.test(structured))type="contract";
  else if(/\bmicrotask\b|\bmicrojob\b|\bgig\b|project based/.test(structured))type="gig";
  else if(/full time|part time|permanent|employee|temporary|intern|volunteer/.test(structured))type="employment";
  if(type)return{engagementType:type,engagementEvidence:"source",engagementLabel:ENGAGEMENT_LABELS[type]};

  const title=String(job.title||"").toLowerCase();
  const text=[job.title,job.description,...(Array.isArray(job.tags)?job.tags:[])].filter(Boolean).join(" ").toLowerCase();
  if(/\bfreelanc(?:e|er|ing)\b|\bindependent contractor\b/.test(text))
    type="freelance";
  else if(/\bcontractor\b|\bcontract[- ]based\b|\bfixed[- ]term\b|^contract\b|\bcontract\s*[)\]]?\s*$/.test(title)||
          /\bindependent contractor\b|\bcontract (?:role|position|work|basis|engagement)\b|\bshort[- ]term contract\b/.test(text))
    type="contract";
  else if(/\bmicro[- ]?tasks?\b|\bmicrojobs?\b|\bgig work\b|\bpaid tasks?\b|\bone[- ]off projects?\b|\btask[- ]based projects?\b/.test(text))
    type="gig";
  else if(/\bfull[- ]time\b|\bpart[- ]time\b|\bpermanent employee\b/.test(title))
    type="employment";
  else type="unknown";
  return{
    engagementType:type,
    engagementEvidence:type==="unknown"?"unknown":"inferred",
    engagementLabel:ENGAGEMENT_LABELS[type]
  };
}

const COUNTRY_ONLY_LOCATION=/\b(?:colombia|brazil|brasil|mexico|méxico|chile|peru|perú|uruguay|paraguay|ecuador|bolivia|costa rica|panama|panamá|guatemala|honduras|el salvador|nicaragua|venezuela|dominican republic|puerto rico|france|germany|spain|italy|portugal|netherlands|belgium|sweden|norway|denmark|finland|poland|ireland|united kingdom|australia|new zealand|india|philippines|singapore|south africa|japan|china|indonesia|thailand|vietnam|malaysia|switzerland|austria|romania|czechia|czech republic|greece|turkey|israel|egypt|nigeria|kenya|ghana|pakistan|bangladesh|sri lanka|nepal|taiwan|south korea|hong kong)\b/i;

export function argentinaEligibility(job){
  const title=String(job.title||""),location=String(job.location||""),description=String(job.description||"");
  const all=title+" "+location+" "+description;
  const hardRestriction=/us only|usa only|united states only|canada only|europe only|uk only|north america(?: only|\b)|united states(?:,| and) canada|us(?:,| and) canada|must be based in the us|u\.s\. residents only|remote \(us|remote \(usa|remote \(north america/i;
  if(hardRestriction.test(title)||hardRestriction.test(location)||((/united states|usa|u\.s\.|\bus\b|canada|north america|europe|united kingdom|\buk\b/i.test(location))&&!/argentina|latam|latin america|south america/i.test(location)))
    return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación fuera de Argentina."};
  if(ARGENTINA_NEGATIVE.test(all)||
     /(?:except|excluding|exclude|not (?:available|hiring|eligible) in|outside of)\s+(?:the\s+)?argentina|argentina\s+(?:excluded|not eligible)/i.test(all))
    return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación."};

  // Structured source restrictions outrank marketing copy in titles/descriptions.
  if(Array.isArray(job.locationRestrictions)){
    const restrictions=job.locationRestrictions.map(x=>String(x||"")).filter(Boolean);
    if(!restrictions.length)return{score:82,label:"Worldwide",reason:"La fuente declara que no hay restricciones geográficas."};
    const declared=restrictions.join(" ");
    if(/argentina/i.test(declared))return{score:100,label:"Argentina",reason:"Argentina figura en los países admitidos por la fuente."};
    if(/latam|latin america|south america|americas/i.test(declared))return{score:92,label:"LatAm",reason:"La fuente declara elegibilidad regional."};
    if(/worldwide|anywhere|global/i.test(declared))return{score:82,label:"Worldwide",reason:"La fuente declara elegibilidad global."};
    return{score:5,label:"No compatible",reason:"La fuente limita la vacante a países específicos y Argentina no figura entre ellos."};
  }

  // Prefer the actual location field over unrelated keywords in the description.
  if(/argentina/i.test(location))return{score:100,label:"Argentina",reason:"La ubicación declarada incluye Argentina."};
  if(/latam|latin america|south america|americas/i.test(location))return{score:92,label:"LatAm",reason:"La ubicación declarada admite LatAm/Américas."};
  if(/worldwide|anywhere|global/i.test(location)||job.worldwide)return{score:82,label:"Worldwide",reason:"La publicación declara alcance global/remoto."};
  if(COUNTRY_ONLY_LOCATION.test(location))return{score:48,label:"A verificar",reason:"La fuente declara otra ubicación, pero no confirma si acepta candidatos de Argentina."};

  if(/argentina/i.test(title+" "+description))return{score:100,label:"Argentina",reason:"La publicación menciona Argentina; confirmar las condiciones específicas."};
  if(/latam|latin america|south america|americas/i.test(title+" "+description))return{score:92,label:"LatAm",reason:"La publicación menciona LatAm/Américas; confirmar las condiciones específicas."};
  if(/worldwide|anywhere|global/i.test(title+" "+description))return{score:82,label:"Worldwide",reason:"La publicación menciona alcance global; confirmar las condiciones específicas."};
  return{score:48,label:"A verificar",reason:"No publica una restricción geográfica concluyente."};
}
export function scamAssessment(job){
  const text=String(job.title||"")+" "+String(job.company||"")+" "+String(job.description||"");
  const hits=HIGH_RISK.filter(rx=>rx.test(text)).map(rx=>rx.source);
  const sourceTrust=Number(job.sourceTrust||60);
  const score=Math.max(0,Math.min(100,sourceTrust-hits.length*35));
  return{score,label:hits.length?"Revisar":score>=80?"Buena señal":"Sin señales fuertes",reasons:hits};
}

export function normalizeMonthlyPay({min,max,currency="USD",period="annual",raw=""}={}){
  const nmin=min==null||min===""?null:Number(min);
  const nmax=max==null||max===""?null:Number(max);
  if(!Number.isFinite(nmin)&&!Number.isFinite(nmax))return{raw:raw||"No publicado",monthlyMin:null,monthlyMax:null,currency};
  const factor=period==="hourly"?160:period==="weekly"?4.33:period==="monthly"?1:period==="annual"?1/12:1;
  return{
    raw,
    monthlyMin:Number.isFinite(nmin)?Math.round(nmin*factor):null,
    monthlyMax:Number.isFinite(nmax)?Math.round(nmax*factor):null,
    currency,period,
    estimateBasis:period==="hourly"?"160 h/mes":period==="weekly"?"4,33 semanas/mes":null
  };
}

/**
 * Generic server-side quality signal.
 * This is intentionally NOT a candidate/job fit score.
 * Personal relevance belongs in the browser and is derived from the user's local profile.
 */
export function qualityBreakdown(job,now=Date.now()){
  const argentina=argentinaEligibility(job);
  const scam=scamAssessment(job);
  const compensation=job.pay?.monthlyMin!=null||job.pay?.monthlyMax!=null?100:45;
  const noWorkerFee=job.workerFee===false?100:job.workerFee===true?0:55;
  const published=job.publishedAt?new Date(job.publishedAt).getTime():NaN;
  const ageDays=Number.isFinite(published)?Math.max(0,(now-published)/86400000):10;
  const freshness=Math.max(20,100-Math.min(30,ageDays)*2.5);
  const score=Math.round(Math.max(0,Math.min(100,
    argentina.score*.25+
    scam.score*.30+
    compensation*.15+
    noWorkerFee*.10+
    freshness*.20
  )));
  return{
    score,
    components:{
      locationCompatibility:argentina.score,
      sourceAndRisk:scam.score,
      compensationTransparency:compensation,
      noWorkerFee,
      freshness:Math.round(freshness)
    }
  };
}

export function finalizeJob(job){
  const {priority:_priority,priorityComponents:_priorityComponents,rank:_rank,rankReason:_rankReason,...publicJob}=job||{};
  const category=publicJob.category||classifyCategory(publicJob);
  const base={...publicJob,category};
  const quality=qualityBreakdown(base);
  return{
    ...base,
    ...classifyEngagement(base),
    argentina:argentinaEligibility(base),
    scam:scamAssessment(base),
    qualityScore:quality.score,
    qualityComponents:quality.components
  };
}
