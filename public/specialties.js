// Heuristic discovery labels, not employer-confirmed job classifications.
export const SPECIALTIES=Object.freeze({
  "":"Todas las especialidades",
  "ai-training":"Entrenamiento IA",
  "data-annotation":"Anotación de datos",
  "ai-evaluation":"Evaluación IA",
  "transcription":"Transcripción"
});
const normal=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const patterns={
 "ai-training":/\b(?:ai trainer|ai training|entrenador(?:a)? de ia|entrenamiento de ia|train(?:ing)? (?:large )?language models?|llm trainer)\b/i,
 "data-annotation":/\b(?:data annotat(?:ion|or|ing)|data label(?:ling|er)|image annotat(?:ion|or)|etiquetad[oa] de datos|anotaci[oó]n de datos|label(?:ling)? images)\b/i,
 "ai-evaluation":/\b(?:ai evaluat(?:ion|or|ing)|llm evaluat(?:ion|or|ing)|model evaluat(?:ion|or)|evaluaci[oó]n de (?:modelos?|ia)|evaluador(?:a)? de ia|red team(?:ing)? (?:llm|ai))\b/i,
 "transcription":/\b(?:transcription(?:ist)?|transcriber|transcripci[oó]n|transcriptor(?:a)?|speech[- ]to[- ]text)\b/i
};
export function specialtiesForJob(job={}){
 const text=normal([job.title,job.description,...(Array.isArray(job.tags)?job.tags:[])].join(" ").slice(0,12000));
 return Object.entries(patterns).filter(([,regex])=>regex.test(text)).map(([name])=>name);
}
export function matchesSpecialty(job,selected=""){
 if(!selected)return true;
 return specialtiesForJob(job).includes(selected);
}
