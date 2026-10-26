const resources = [
  { id:'pinballs', name:'Pinballs', ignis:0.55556, icon:'/shop-assets/pinballs.png' },
  { id:'wishboxes', name:'Wishboxes', ignis:500, icon:'/shop-assets/wishboxes.png' },
  { id:'tatari-capsules', name:'Tatari Capsules', ignis:40, icon:'/shop-assets/tatari-capsules.png' },
  { id:'delicate-bento', name:'Delicate Bento', ignis:166.67, icon:'/shop-assets/delicate-bento.png?v=2' },
  { id:'deluxe-bento', name:'Deluxe Bento', ignis:238, icon:'/shop-assets/deluxe-bento.png?v=2' },
  { id:'glitter-fruit', name:'Glitter Fruit', ignis:200, icon:'/shop-assets/glitter-fruit.png' },
  { id:'pills', name:'Pills', ignis:250, icon:'/shop-assets/pills.png' },
  { id:'spa-soap', name:'Spa Soap', ignis:100, icon:'/shop-assets/spa-soap.png' },
  { id:'scan-capsules', name:'Scan Capsules', ignis:2, icon:'/shop-assets/scan-capsules.png' },
  { id:'energy-drinks', name:'Energy Drinks', ignis:0.72, icon:'/shop-assets/energy-drinks.png' }
];
const list=document.querySelector('#resource-list'), price=document.querySelector('#offer-price'), currency=document.querySelector('#price-currency'), qtyInputs=new Map();
const fmtUSD=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
const fmtIgnis=v=>`${new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(v)} Ignis Gems`;
for(const item of resources){
 const row=document.createElement('article'); row.className='shop-item'; row.dataset.resource=item.id;
 row.innerHTML=`<img src="${item.icon}" alt="" width="48" height="48" loading="lazy"><div class="shop-item-info"><h3>${item.name}</h3></div><label for="qty-${item.id}">Qty</label><input id="qty-${item.id}" type="number" inputmode="numeric" min="0" step="1" placeholder="0" aria-label="${item.name} quantity" autocomplete="off">`;
 list.append(row); qtyInputs.set(item.id,row.querySelector('input'));
}
function calculate(){
 const totals=resources.reduce((sum,item)=>{const raw=qtyInputs.get(item.id).value;const qty=raw===''?0:Math.max(0,Number(raw)||0);sum.ignis+=qty*item.ignis;return sum;},{ignis:0});
 const totalUSD=totals.ignis/100,raw=price.value.trim(),amount=raw===''?0:Math.max(0,Number(raw)||0),unit=currency.value,total=unit==='usd'?totalUSD:totals.ignis,percent=amount>0?total/amount*100:null;
 document.querySelector('#bundle-value').textContent=fmtUSD(totalUSD);document.querySelector('#bundle-ignis').textContent=fmtIgnis(totals.ignis);
 document.querySelector('#entered-value').textContent=raw===''?'—':unit==='usd'?fmtUSD(amount):fmtIgnis(amount);
 document.querySelector('#value-percent').textContent=percent===null?'—':`${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(percent)}%`;
 document.querySelector('#result-message').textContent=percent===null?'Enter a price and package contents to compare.':percent>100?`The listed contents are ${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(percent-100)}% above the offer price.`:percent<100?`The listed contents are ${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(100-percent)}% below the offer price.`:'The listed contents value matches the offer price.';
 document.querySelector('#value-meter-fill').style.width=`${percent===null?0:Math.min(percent,200)/2}%`;
}
price.addEventListener('input',calculate);currency.addEventListener('change',calculate);for(const input of qtyInputs.values())input.addEventListener('input',calculate);
document.querySelector('#clear-quantities').addEventListener('click',()=>{for(const input of qtyInputs.values())input.value='';calculate();qtyInputs.get(resources[0].id).focus();});
document.querySelector('#clear-offer').addEventListener('click',()=>{price.value='';currency.value='usd';for(const input of qtyInputs.values())input.value='';calculate();price.focus();});calculate();