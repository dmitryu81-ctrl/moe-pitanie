'use strict';
let selectedWeek='current', selectedDay=Object.keys(nutritionData.current.menu)[0];
const historyKey='moe_pitanie_history';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readStored(key,fallback){try {return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{alert('Браузер не разрешает сохранение. Скачайте отметки в разделе «История».');return false;}}
function historyItems(){const v=readStored(historyKey,[]);return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];}
function tab(id){document.querySelectorAll('section').forEach(s=>s.classList.toggle('hidden',s.id!==id));document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===id)));if(id==='history')renderHistory();}
function protein(r){return r.items.reduce((s,x)=>s+nutritionData.foods[x.food].protein*x.g/100,0);}
function ingredientText(x){return nutritionData.foods[x.food].name+' — '+x.g.toLocaleString('ru-RU')+' г';}
function showDay(d){
 selectedDay=d;const w=nutritionData[selectedWeek];const di=Object.keys(w.menu).indexOf(d);
 let h='<h2>'+esc(d)+(w.startDay?' · '+(w.startDay+di)+' октября':'')+'</h2>';
 if(w.daily)h+='<p class="small">Ориентир по назначению: 80 г белка/сутки. Оценка этого дня по CoFID: около '+Math.round(w.daily[di].protein)+' г; см. условия расчёта в <a href="README.html#protein">памятке</a>.</p>';
 w.menu[d].forEach(x=>{const r=w.recipes[x[2]];h+='<div class="meal"><b>'+esc(x[0])+'</b><br>'+esc(x[1]);if(r.items)h+='<p class="small">'+r.items.map(ingredientText).map(esc).join(' · ')+'</p>';h+='<br><button data-recipe="'+esc(x[2])+'">📖 Открыть рецепт</button></div>';});
 $('day').innerHTML=h;$('day').querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.recipe));
 $('days').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.day===d)));
}
function openRecipe(id){const r=nutritionData[selectedWeek].recipes[id];if(!r)return;tab('recipes');
 const ingredients=r.items?r.items.map(ingredientText):r.i;
 $('recipe').innerHTML='<h3>'+esc(r.t)+'</h3><p><b>⏱ Время:</b> '+esc(r.time)+' &nbsp; <b>🍽 Порция:</b> '+esc(r.portion)+'</p>'+(r.items?'<p class="small">Все количества — на одного человека, до приготовления, для съедобной части. Крупы, макароны и мука — сухие. Вода указана в шагах и не входит в покупки. Молоко и масло также взвешивать в граммах.</p>':'')+'<h4>🧺 Ингредиенты</h4><ul>'+ingredients.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul><h4>👨‍🍳 Приготовление</h4><ol>'+r.s.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol><button id="markCooked">✅ Приготовлено</button><button id="backMenu">К меню</button>';
 $('markCooked').onclick=()=>{const h=historyItems();const text=new Date().toLocaleDateString('ru-RU')+' — '+nutritionData[selectedWeek].label+' — '+selectedDay+' — '+r.t;if(!h.includes(text)){h.push(text);if(!store(historyKey,h))return;} $('markCooked').textContent='✅ Сохранено в истории';};$('backMenu').onclick=()=>tab('menu');
}
function shoppingTotals(week=selectedWeek){const out={};const w=nutritionData[week];Object.values(w.menu).flat().forEach(x=>w.recipes[x[2]].items.forEach(i=>out[i.food]=(out[i.food]||0)+i.g));return out;}
function renderShopping(){if(selectedWeek==='original'){$('shopping').innerHTML='<p class="notice small">Архивный список из исходного файла, без пересчёта. Это прежнее меню, а не текущая рекомендация.</p>'+nutritionData.original.shopHtml;return;}
 const w=nutritionData[selectedWeek],shopKey='moe_pitanie_shop_'+w.storageId;const sums=shoppingTotals(),checked=readStored(shopKey,{});let h='<p class="small">На 1 человека, 7 дней, по одной полной порции каждого блюда. Ниже — точная потребность в съедобной части до приготовления; остатки из упаковок в меню не добавляются. Для овощей и фруктов купите дополнительно запас на кожуру, семена и сердцевины. Рыба указана без ледяной глазури. Вода и соль в покупки не включены; рецепты не требуют досаливания.</p><p><a href="'+w.shoppingFile+'" download>Скачать список покупок</a> · <a href="README.html#shopping">Как отмерять и покупать</a></p>';
 const groups=[...new Set(Object.values(nutritionData.foods).map(f=>f.group))];groups.forEach(group=>{h+='<h3>'+esc(group)+'</h3>';Object.entries(sums).filter(([k])=>nutritionData.foods[k].group===group).forEach(([k,g])=>{h+='<label class="shop-item"><input type="checkbox" data-food="'+k+'" '+(checked[k]?'checked':'')+'><span>'+esc(nutritionData.foods[k].name)+' — <b>'+g.toLocaleString('ru-RU')+' г</b></span></label>';});});h+='<button id="printShopping">Распечатать</button>';$('shopping').innerHTML=h;
 $('shopping').querySelectorAll('input[data-food]').forEach(i=>i.onchange=()=>{const v=readStored(shopKey,{});v[i.dataset.food]=i.checked;store(shopKey,v);});$('printShopping').onclick=()=>window.print();
}
function renderHistory(){const h=historyItems();$('historyList').innerHTML='<div class="card"><b>Доступные недели:</b><br><button data-week="current">19–25 октября 2026</button><button data-week="previous">12–18 октября 2026</button><button data-week="original">Исходная неделя v7.1</button></div>'+(h.length?h.map(x=>'<div class="meal">✅ '+esc(x)+'</div>').join(''):'<p>Пока нет сохранённых отметок.</p>');$('historyList').querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>selectWeek(b.dataset.week));}
function selectWeek(key){selectedWeek=key;$('week').value=key;const w=nutritionData[key];$('weekTitle').textContent=w.label;
 $('guidance').innerHTML=key!=='original'?'Меню без груш. Порции рассчитаны на одного человека. Белок — ориентир 80 г/сутки по вашему назначению; жиры, углеводы и калорийность не заявлены. Без голодания, сладких напитков, субпродуктов и мясных бульонов; готовим с растительным маслом и нежирными молочными продуктами. Ограничения жидкости, калия и фосфора зависят от анализов и назначений. <a href="README.html">Памятка и источники</a>.':'Архив исходного меню v7.1 сохранён без изменений, включая старые блюда с грушей. Даты 18–24 августа взяты из исходного файла и не исправлены. Для текущего меню выберите 19–25 октября.';
 $('days').innerHTML=Object.keys(w.menu).map((d,i)=>'<button data-day="'+esc(d)+'">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]+'</button>').join('');$('days').querySelectorAll('button').forEach(b=>b.onclick=()=>showDay(b.dataset.day));$('recipe').textContent='Выберите блюдо из меню.';showDay(Object.keys(w.menu)[0]);renderShopping();tab('menu');}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('week').onchange=()=>selectWeek($('week').value);
function downloadJson(name,value){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
let fileHistory=[];
$('exportHistory').onclick=()=>downloadJson('moe-pitanie-history.json',[...new Set([...fileHistory,...historyItems()])]);
$('importHistory').onchange=async e=>{try{const imported=JSON.parse(await e.target.files[0].text());if(!Array.isArray(imported)||imported.some(x=>typeof x!=='string'))throw Error();const merged=[...new Set([...historyItems(),...imported])];if(store(historyKey,merged)){renderHistory();alert('Отметки добавлены.');}}catch{alert('Нужен JSON-файл с массивом текстовых отметок.');}e.target.value='';};
// Preserve archive-provided history; merge it with the existing browser storage.
fetch('history.json').then(r=>r.ok?r.json():[]).then(h=>{if(Array.isArray(h)){fileHistory=h.filter(x=>typeof x==='string');const merged=[...new Set([...historyItems(),...fileHistory])];if(fileHistory.length)store(historyKey,merged);renderHistory();}}).catch(()=>{});
selectWeek('current');
