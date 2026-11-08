#!/usr/bin/env node
const fs=require('fs'), path=require('path'), {pathToFileURL,fileURLToPath}=require('url'), {spawnSync}=require('child_process');
const args=process.argv.slice(2); const opt=(k,d)=>{let i=args.indexOf(k);return i<0?d:args[i+1]};
if(!args[0]||args.includes('--help')){console.log('node convert.cjs INPUT.html --out OUTPUT_DIR [--selector .page] [--width 1200] [--app "Adobe InDesign 2026"] [--extract-only]');process.exit(0)}
(async()=>{
 const input=path.resolve(args[0]), out=path.resolve(opt('--out','indesign-output'));fs.mkdirSync(out,{recursive:true});
 if(fs.existsSync(path.join(out,'document.indd')))throw Error('Output document.indd already exists; choose a new output directory.');
 let pw;try{pw=require('playwright')}catch(e){throw Error('Install playwright or set NODE_PATH to its node_modules directory.')}
 const chrome=opt('--chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
 const browser=await pw.chromium.launch({executablePath:chrome,headless:true});
 let layout;
 try{
 const page=await browser.newPage({viewport:{width:Number(opt('--width',1200)),height:900},deviceScaleFactor:1});
 await page.goto(pathToFileURL(input).href,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>Promise.all(Array.from(document.images).map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r}))));
 layout=await page.evaluate((selector)=>{
 const warns=new Set(), roots=Array.from(document.querySelectorAll(selector));if(!roots.length)throw Error('No pages match '+selector);
 const color=s=>{let m=s.match(/^rgba?\(([^)]+)\)/);if(!m)return null;let v=m[1].split(',').map(Number);return v.length>3&&v[3]===0?null:v.slice(0,3)};
 return {warnings:[],pages:roots.map(root=>{const rr=root.getBoundingClientRect(),items=[];
 const box=r=>({x:r.left-rr.left,y:r.top-rr.top,w:r.width,h:r.height});
 function walk(el){const s=getComputedStyle(el),r=el.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return;
 if(s.transform!=='none'||s.filter!=='none'||s.backgroundImage!=='none')warns.add('Unsupported transform/filter/background-image: '+el.tagName);
 if(s.opacity!=='1')warns.add('Opacity is not preserved.');
 const fill=color(s.backgroundColor);if(fill&&r.width&&r.height)items.push({type:'rect',...box(r),fill});
 if(parseFloat(s.borderTopWidth)>0)warns.add('CSS borders and rounded corners are not preserved.');
 if(el.tagName==='IMG'){items.push({type:'image',...box(r),src:el.currentSrc,fit:s.objectFit});return}
 if(['SVG','CANVAS','VIDEO','IFRAME'].includes(el.tagName)){warns.add('Unsupported element: '+el.tagName);return}
 for(const n of el.childNodes){if(n.nodeType===1)walk(n);else if(n.nodeType===3&&n.textContent.trim()){
 const text=n.textContent.replace(/\s+/g,' '), range=document.createRange();range.selectNodeContents(n);const b=range.getBoundingClientRect();if(!b.width||!b.height)continue;
 items.push({type:'text',...box(b),text,font:s.fontFamily.split(',')[0].replace(/["']/g,''),size:parseFloat(s.fontSize),leading:parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.2,fill:color(s.color)||[0,0,0],weight:parseInt(s.fontWeight)||400,italic:s.fontStyle==='italic',align:s.textAlign});
 }} }
 walk(root);return {width:rr.width,height:rr.height,items};}),get warnings(){return Array.from(warns)}};
 },opt('--selector','.page'));
 // The body fallback is explicit in CLI usage: use --selector body for an unpaginated file.
 await page.screenshot({path:path.join(out,'html-preview.png'),fullPage:true});
 }finally{await browser.close()}
 for(const p of layout.pages)for(const item of p.items)if(item.type==='image'){
 if(item.src.startsWith('file:'))item.file=fileURLToPath(item.src);
 else if(item.src.startsWith('data:')){const m=item.src.match(/^data:image\/(png|jpeg|webp);base64,(.*)$/s);if(!m){layout.warnings.push('Unsupported data image');continue}item.file=path.join(out,'image-'+p.items.indexOf(item)+'-'+layout.pages.indexOf(p)+'.'+m[1]);fs.writeFileSync(item.file,Buffer.from(m[2],'base64'))}
 else layout.warnings.push('Remote image not embedded: '+item.src);
 }
 fs.writeFileSync(path.join(out,'layout.json'),JSON.stringify(layout,null,2));
 const template=fs.readFileSync(path.join(__dirname,'build.jsx'),'utf8');
 const jsx='var DATA='+JSON.stringify(layout)+';\nvar OUT='+JSON.stringify(out)+';\n'+template;
 const script=path.join(out,'build.jsx');fs.writeFileSync(script,jsx);
 if(args.includes('--extract-only')){console.log(JSON.stringify({ok:true,stage:'extracted',out,warnings:layout.warnings}));return}
 const appName=opt('--app','Adobe InDesign 2026');
 const result=spawnSync('osascript',['-e','using terms from application '+JSON.stringify(appName)+'\non run argv\nwith timeout of 600 seconds\nset jsxFile to (POSIX file (item 2 of argv)) as alias\ntell application '+JSON.stringify(appName)+'\ndo script jsxFile language javascript\nend tell\nend timeout\nend run\nend using terms from',appName,script],{encoding:'utf8',timeout:620000});
 if(result.status!==0)throw Error(result.stderr||result.error||'AppleScript failed');
 console.log(result.stdout.trim());
 if(!fs.existsSync(path.join(out,'report.json')))throw Error('InDesign did not create report.json');
 const report=JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8'));if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1});
