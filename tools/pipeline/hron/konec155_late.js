/* ── последний из поздних модулей: обёртки показывают текст прежнего правила (см. ДО150 в начале подъёмников) ──
   Наборы проверок читают исходник правила (учтены ли удача, бафф и т. п.); прежнее правило работает внутри обёрток. */
safeFn(()=>{if(typeof ДО150==="undefined")return;for(const [k,f] of Object.entries(ДО150)){const тек=window[k];
 if(typeof тек==="function"&&тек!==f&&!Object.prototype.hasOwnProperty.call(тек,"toString"))matKeep(f,тек);}});
