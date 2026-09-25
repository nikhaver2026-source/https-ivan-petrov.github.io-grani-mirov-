/* Русское слово → фонемы в записи, на которой учились голоса Piper.
   Запасной путь для слов, которых нет в словаре игры: имена, склеенные
   генератором, редкие формы. Ударение: «ё» — всегда ударная, иначе —
   по окончанию, по таблице, выученной на словаре самой игры (ru-stress.json);
   без таблицы — предпоследний слог. */
(function(root){
const ГЛ="аеёиоуыэюя",МЯГК="еёиюяь",ЙОТ={е:"e",ё:"ɵ",ю:"u",я:"a"};
const СОГ={б:"b",в:"v",г:"ɡ",д:"d",ж:"ʒ",з:"z",й:"j",к:"k",л:"ɭ",м:"m",н:"n",п:"p",р:"r",с:"s",т:"t",ф:"f",х:"x",ц:"ts",ч:"tʃʲ",ш:"ʃ",щ:"ɕ"};
const ТВЁРД=new Set(["ж","ш","ц"]);
const ЗВОН={b:"p",v:"f",ɡ:"k",d:"t",ʒ:"ʃ",z:"s"},ГЛУХ={p:"b",f:"v",k:"ɡ",t:"d",ʃ:"ʒ",s:"z"};
let СУФ=null;
function ударение(w,дано){
 if(дано!=null)return дано;
 const i=w.indexOf("ё");if(i>=0)return i;
 const гл=[];for(let k=0;k<w.length;k++)if(ГЛ.includes(w[k]))гл.push(k);
 if(!гл.length)return -1;
 if(гл.length===1)return гл[0];
 /* Ударение по окончанию: таблица выучена на словаре самой игры. */
 let сКонца=1;
 if(СУФ)for(let k=Math.min(5,w.length);k>=1;k--){const e=СУФ[w.slice(-k)];if(e!=null){сКонца=e;break;}}
 сКонца=Math.min(гл.length-1,Math.max(0,сКонца));
 return гл[гл.length-1-сКонца];}
function g2p(слово,ударПоз){
 let w=String(слово).toLowerCase().replace(/[^а-яё]/g,"");
 if(!w)return "";
 w=w.replace(/сч/g,"щ").replace(/зч/g,"щ").replace(/т[ь]?ся$/,"ца").replace(/(ого|его)$/,m=>m[0]+"во")
  .replace(/стн/g,"сн").replace(/здн/g,"зн").replace(/дц/g,"ц").replace(/тц/g,"ц");
 const уд=ударение(w,ударПоз);
 const out=[];/* элементы: {p, звон:бул|null, гл:бул} */
 for(let i=0;i<w.length;i++){
  const ch=w[i],след=w[i+1]||"",пред=w[i-1]||"";
  if(ГЛ.includes(ch)){
   const ударная=i===уд;
   const послеГл=!пред||ГЛ.includes(пред)||пред==="ъ"||пред==="ь";
   const мягкаяПозиция=пред&&!ГЛ.includes(пред)&&!ТВЁРД.has(пред)&&пред!=="ъ";
   let v;
   const последняя=i===w.length-1||(i===w.length-2&&w[w.length-1]==="й");
   const предударная=(()=>{for(let k=i+1;k<w.length;k++)if(ГЛ.includes(w[k]))return k===уд;return false;})();
   if(ch in ЙОТ){
    if(послеГл){out.push({p:пред==="ь"?"jj":"j"});}
    if(ch==="ё")v="ɵ";
    else if(ch==="е")v=ударная?"e":(последняя?"ɪ":"i");
    else if(ch==="ю")v="u";
    else v=ударная?"ɑ":(послеГл&&предударная?"a":"ʌ");
    if(!послеГл&&ТВЁРД.has(пред)){if(ch==="е")v=ударная?"ɛ":"y";}
   }else if(ch==="и"){v=(ТВЁРД.has(пред))?"y":(ударная?"i":(последняя?"ɪ":"i"));}
   else if(ch==="ы")v="y";
   else if(ch==="э")v=ударная?"ɛ":"ɪ";
   else if(ch==="у")v="u";
   else if(ch==="о")v=ударная?"o":"ʌ";
   else if(ch==="а")v=ударная?"ɑ":(предударная?"a":(последняя&&пред!=="ч"&&пред!=="щ"?"a":"ʌ"));
   out.push({p:(ударная?"ˈ":"")+v,гл:true});continue;}
  if(ch==="ь"||ch==="ъ")continue;
  let p=СОГ[ch];if(!p)continue;
  const мягкий=!ТВЁРД.has(ch)&&ch!=="ч"&&ch!=="щ"&&ch!=="й"&&МЯГК.includes(след)&&след!=="";
  /* Мягкость на конце слова и перед согласным голос держит, хотя эталонный
     разбор, на котором он учился, её теряет («Гран Миров» вместо «Грань
     Миров»): с мягкостью слова узнаются заметно чаще (сверка распознавателем,
     версия 3.4). Мягкое «л» на конце — «lʲ»: «ɭʲ» там голос глотает до «й». */
  const конецЛь=ch==="л"&&след==="ь"&&i===w.length-2;
  if(мягкий)p=конецЛь?"lʲ":p+"ʲ";
  out.push({p,c:ch});}
 /* оглушение на конце и перед глухим, озвончение перед звонким */
 for(let i=out.length-1;i>=0;i--){
  const x=out[i];if(x.гл||x.c==null)continue;
  const base=x.p.replace("ʲ",""),мяг=x.p.endsWith("ʲ")?"ʲ":"";
  const n=out[i+1];
  const nb=n&&!n.гл&&n.c!=null?n.p.replace("ʲ",""):null;
  if(!n){if(ЗВОН[base])x.p=ЗВОН[base]+мяг;continue;}
  if(nb&&ГЛУХ[nb]!==undefined||nb==="x"||nb==="ts"||nb==="tʃ"){if(ЗВОН[base])x.p=ЗВОН[base]+мяг;}
  else if(nb&&ЗВОН[nb]&&nb!=="v"){if(ГЛУХ[base])x.p=ГЛУХ[base]+мяг;}}
 return out.map(x=>x.p).join("").replace(/ɡk/g,"xk").replace(/ɡkʲ/g,"xkʲ");}
function setSuffixes(t){СУФ=t;}
root.RuG2P={g2p,setSuffixes};
if(typeof module!=="undefined")module.exports={g2p,setSuffixes};
})(typeof window!=="undefined"?window:globalThis);
