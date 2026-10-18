// Browser-local, user-confirmed application outcomes. No automation or job submissions.
export const OUTCOME_KEY="jobas:application-outcomes:v1";
export const OUTCOME_STAGES=Object.freeze({
  preparing:"Preparando",
  contacted:"Contacté / postulé (confirmado por mí)",
  interview:"Entrevista",
  offer:"Oferta recibida",
  rejected:"Rechazada",
  closed:"Cerrada"
});
const stageSet=new Set(Object.keys(OUTCOME_STAGES));
const key=job=>String(job?.id||job?.url||job?.sourceDetail||"").trim();
const day=/^\d{4}-\d{2}-\d{2}$/;
const validDay=v=>day.test(String(v||""))&&!Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
const clean=input=>String(input||"").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,"").slice(0,1200).trim();
export function followUpState(outcome,now=new Date()){
  if(outcome?.stage!=="contacted"||!validDay(outcome.contactDate))return {due:false,days:null,reason:"No hay seguimiento pendiente comprobado"};
  const elapsed=Math.floor((Date.parse(now.toISOString().slice(0,10)+"T12:00:00Z")-Date.parse(outcome.contactDate+"T12:00:00Z"))/86400000);
  return {due:elapsed>=10,days:elapsed,reason:elapsed>=10?"Podés considerar un seguimiento manual":"Aún dentro del plazo de 10 días"};
}
export function createOutcomeStore(storage=globalThis.localStorage){
  const all=()=>{
    try{
      const v=JSON.parse(storage?.getItem(OUTCOME_KEY)||"{}");
      return v&&typeof v==="object"&&!Array.isArray(v)?v:{};
    }catch{return {};}
  };
  return {
    all,
    get(job){
      const id=key(job);
      const item=all()[id];
      return item&&stageSet.has(item.stage)?item:{stage:"preparing",contactDate:"",notes:"",updatedAt:""};
    },
    save(job,{stage,contactDate="",notes=""}={}){
      const id=key(job);
      if(!id)throw new Error("OPPORTUNITY_ID_MISSING");
      if(!stageSet.has(stage))throw new Error("INVALID_APPLICATION_STAGE");
      if(contactDate&&(!validDay(contactDate)||contactDate>new Date().toISOString().slice(0,10)))throw new Error("INVALID_CONTACT_DATE");
      const data=all();
      const item={stage,contactDate:stage==="contacted"?contactDate:"",notes:clean(notes),updatedAt:new Date().toISOString()};
      data[id]=item;
      storage?.setItem(OUTCOME_KEY,JSON.stringify(data));
      return item;
    },
    remove(job){
      const id=key(job);const data=all();delete data[id];storage?.setItem(OUTCOME_KEY,JSON.stringify(data));
    }
  };
}
