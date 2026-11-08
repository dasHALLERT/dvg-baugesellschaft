import {readFile,writeFile} from 'node:fs/promises';
const assignments=JSON.parse(await readFile(new URL('../content/gallery-assignment.json',import.meta.url)));
const figures=JSON.parse(await readFile(new URL('../content/gallery-figures.json',import.meta.url)));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
const captions={
 'projekt-03':'Einbau eines Schachts im ausgehobenen Arbeitsbereich',
 'projekt-08':'Modellierte Erdfläche mit Stützwänden und Treppe',
 'projekt-12':'Setzen von Einfassungen für die Pflasterfläche',
 'projekt-15':'Gepflasterte Garagenzufahrt mit Einfassung',
 'projekt-22':'Gartentreppe mit Natursteineinfassung',
 'projekt-23':'Treppenanlage mit gepflasterten Podesten am Wohnhaus',
 'planung-baustelle':'Ausführungsplanung auf der Baustelle',
 'beratung-bauvorhaben':'Beratungsgespräch zur Auffahrt'
};
for(const [slug,{photos,intro}] of Object.entries(assignments)){
 const file=new URL(`../${slug}.html`,import.meta.url);let page=await readFile(file,'utf8');
 const output=photos.map((key,index)=>{
  let f=figures[key];const caption=captions[key];
  if(!f){
   if(!caption)throw Error(`Unbekanntes Motiv ${key}`);
   const stem=`assets/${key}-dennis${key==='planung-baustelle'?'-schulter':''}`;
   f=`<figure><button class="gallery-open" type="button" data-full="${stem}-1536.webp" data-caption="${escape(caption)}" aria-label="Foto vergrößern: ${escape(caption)}"><img src="${stem}-640.webp" srcset="${stem}-640.webp 640w, ${stem}-1280.webp 1280w, ${stem}-1536.webp 1536w" sizes="(max-width: 700px) 100vw, (max-width: 1000px) 45vw, 30vw" alt="${escape(caption)}" loading="lazy" width="1536" height="1024"><span class="zoom-mark" aria-hidden="true">↗</span></button><figcaption><span>${escape(caption)}</span><span class="gallery-photo-number">00</span></figcaption></figure>`;
  }else if(caption){
   f=f.replace(/data-caption="[^"]*"/,`data-caption="${escape(caption)}"`).replace(/aria-label="Foto vergrößern:[^"]*"/,`aria-label="Foto vergrößern: ${escape(caption)}"`).replace(/alt="[^"]*"/,`alt="${escape(caption)}"`).replace(/<figcaption><span>.*?<\/span>/,`<figcaption><span>${escape(caption)}</span>`);
  }
  if(key==='beratung-bauvorhaben') f=f.replace(/<figcaption><span>.*?<\/span>/,'<figcaption><span></span>');
  return f.replace(/(<span class="gallery-photo-number">)\d+(<\/span>)/,`$1${String(index+1).padStart(2,'0')}$2`);
 }).join('');
 const marker='<section id="galerie"';const pos=page.indexOf(marker);if(pos<0)throw Error(`Galerie fehlt: ${slug}`);
 let section=page.slice(pos);section=section.replace(/(<\/h2><\/div>\s*<p>).*?(<\/p>\s*<\/div>\s*<div class="service-gallery)/s,`$1${escape(intro)}$2`).replace(/<div class="service-gallery[^"]*">.*?<\/div>\s*<p class="gallery-growing">/s,`<div class="service-gallery${slug==='tor-und-zaunanlagen'?' tor-zaun-gallery':photos.length===1?' gallery-single':''}">${output}</div><p class="gallery-growing">`);
 if(slug==='planung-und-beratung')section=section.replace('ECHTE EINBLICKE. ECHTES HANDWERK.','PLANUNG UND BERATUNG.').replace('Von der Baustelle.','Von der Idee zur Umsetzung.');
 await writeFile(file,page.slice(0,pos)+section);
}
console.log('Leistungsgalerien mit eindeutiger Bildzuordnung aktualisiert.');
