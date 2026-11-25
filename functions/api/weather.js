/* Estimativa meteorológica para a sede de Manari; não é um aviso do INMET. */
export const LOCATION=Object.freeze({city:'Manari',state:'PE',latitude:-8.96389,longitude:-37.62833,timezone:'America/Recife'});
export const SOURCE_URL='https://api.open-meteo.com/v1/forecast?latitude=-8.96389&longitude=-37.62833&current=temperature_2m&temperature_unit=celsius&timeformat=unixtime&timezone=America%2FRecife&forecast_days=1';
const MAX_AGE=90*60*1000;
export function normalizeWeather(raw,now=Date.now()){
 const current=raw?.current,temperature=current?.temperature_2m,time=current?.time;
 if(typeof temperature!=='number'||!Number.isFinite(temperature)||temperature < -60||temperature > 65||raw?.current_units?.temperature_2m!=='°C'||!Number.isSafeInteger(time))throw new Error('Invalid weather data');
 const timestamp=time*1000;
 if(now-timestamp>MAX_AGE||timestamp-now>15*60*1000)throw new Error('Stale weather data');
 if(typeof raw.latitude!=='number'||typeof raw.longitude!=='number'||Math.abs(raw.latitude-LOCATION.latitude)>.5||Math.abs(raw.longitude-LOCATION.longitude)>.5)throw new Error('Wrong weather location');
 return {city:LOCATION.city,state:LOCATION.state,temperatureC:temperature,observedAt:new Date(timestamp).toISOString(),fetchedAt:new Date(now).toISOString(),timezone:LOCATION.timezone,source:'Open-Meteo',sourceUrl:'https://open-meteo.com/',kind:'model-estimate'};
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':status===200?'public, max-age=600':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function onRequest(context){
 const {request}=context;
 if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
 const url=new URL(request.url),key=new Request(url.origin+'/api/weather');
 const cache=globalThis.caches?.default;
 try{
  const hit=await cache?.match(key);
  if(hit){const body=await hit.clone().json();const age=Date.now()-Date.parse(body.observedAt);if(body.kind==='model-estimate'&&body.city==='Manari'&&Number.isFinite(age)&&age<=MAX_AGE&&age>=-15*60*1000)return hit;}
 }catch{/* Cache indisponível não impede a consulta à fonte. */}
 try{
  const upstream=await fetch(SOURCE_URL,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
  if(!upstream.ok)throw new Error('Weather source unavailable');
  const response=json(normalizeWeather(await upstream.json()));
  if(cache&&context.waitUntil)context.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
  return response;
 }catch{return json({error:'Temperatura temporariamente indisponível'},503);}
}
