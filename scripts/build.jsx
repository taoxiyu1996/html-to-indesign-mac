(function(){
 var doc=null, old=app.scriptPreferences.measurementUnit, warnings=DATA.warnings.slice(0), counts={text:0,image:0,rect:0}, overset=0, missingFonts=0, outside=0;
 function q(s){return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n')+'"';}
 function writeReport(ok,error){var f=File(OUT+'/report.json');f.encoding='UTF-8';f.open('w');var ws=[];for(var i=0;i<warnings.length;i++)ws.push(q(warnings[i]));f.write('{"ok":'+ok+',"pages":'+(doc?doc.pages.length:0)+',"textFrames":'+counts.text+',"images":'+counts.image+',"rectangles":'+counts.rect+',"overset":'+overset+',"missingFonts":'+missingFonts+',"outside":'+outside+',"warnings":['+ws.join(',')+'],"error":'+q(error||'')+'}');f.close();}
 try{
 app.scriptPreferences.measurementUnit=MeasurementUnits.POINTS;
 doc=app.documents.add();doc.documentPreferences.facingPages=false;
 doc.viewPreferences.horizontalMeasurementUnits=MeasurementUnits.POINTS;doc.viewPreferences.verticalMeasurementUnits=MeasurementUnits.POINTS;doc.viewPreferences.rulerOrigin=RulerOrigin.PAGE_ORIGIN;
 doc.documentPreferences.pageWidth=DATA.pages[0].width*.75;doc.documentPreferences.pageHeight=DATA.pages[0].height*.75;
 function sw(rgb){if(!rgb)return doc.swatches.itemByName('None');var name='HTML-'+rgb.join('-'),c=doc.colors.itemByName(name);if(!c.isValid)c=doc.colors.add({name:name,model:ColorModel.PROCESS,space:ColorSpace.RGB,colorValue:rgb});return c;}
 for(var pi=0;pi<DATA.pages.length;pi++){
 var p=pi===0?doc.pages[0]:doc.pages.add(), pd=DATA.pages[pi];
 p.resize(CoordinateSpaces.INNER_COORDINATES,AnchorPoint.TOP_LEFT_ANCHOR,ResizeMethods.REPLACING_CURRENT_DIMENSIONS_WITH,[pd.width*.75,pd.height*.75]);
 p.marginPreferences.properties={top:0,bottom:0,left:0,right:0};
 for(var i=0;i<pd.items.length;i++){
 var it=pd.items[i];if(it.w<=0||it.h<=0)continue;
 var b=[it.y*.75,it.x*.75,(it.y+it.h)*.75,(it.x+it.w)*.75],o;
 if(it.x<-.5||it.y<-.5||it.x+it.w>pd.width+.5||it.y+it.h>pd.height+.5)outside++;
 if(it.type==='rect'){o=p.rectangles.add({geometricBounds:b,fillColor:sw(it.fill),strokeWeight:0});counts.rect++;}
 else if(it.type==='image'){
 if(!it.file){warnings.push('Image skipped: '+it.src);continue}o=p.rectangles.add({geometricBounds:b,strokeWeight:0});o.place(File(it.file));o.fit(it.fit==='contain'?FitOptions.PROPORTIONALLY:FitOptions.FILL_PROPORTIONALLY);o.fit(FitOptions.CENTER_CONTENT);counts.image++;
 }else if(it.type==='text'){
 // Browser line boxes include extra ascender room; allow a small height tolerance.
 b[2]+=Math.max(3,it.size*.2);b[3]+=1.5;
 o=p.textFrames.add({geometricBounds:b});o.textFramePreferences.insetSpacing=0;o.textFramePreferences.firstBaselineOffset=FirstBaseline.ASCENT_OFFSET;o.contents=it.text;
 var t=o.texts[0];t.pointSize=it.size*.75;t.leading=it.leading*.75;t.fillColor=sw(it.fill);
 try{var font=app.fonts.itemByName(it.font);if(!font.isValid){font=app.fonts.itemByName(it.font+'\tRegular')}if(!font.isValid)throw Error('font unavailable');t.appliedFont=font;
 if(it.weight>=600){try{t.fontStyle='Bold'}catch(ignored){warnings.push('Bold unavailable: '+it.font)}}
 }catch(fe){missingFonts++;warnings.push('Font substituted: '+it.font)}
 if(it.italic){try{t.fontStyle='Italic'}catch(ignored2){}}
 if(o.overflows)overset++;counts.text++;
 }
 }
 }
 doc.save(File(OUT+'/document.indd'));
 var savedPath=doc.fullName;
 // Reopen only the document created by this script, leaving user documents untouched.
 doc.close(SaveOptions.NO);doc=app.open(savedPath,false);
 overset=0;for(var ti=0;ti<doc.textFrames.length;ti++)if(doc.textFrames[ti].overflows)overset++;
 doc.exportFile(ExportFormat.PDF_TYPE,File(OUT+'/proof.pdf'),false);
 writeReport(true,'');doc.close(SaveOptions.NO);return 'Created '+OUT+'/document.indd';
 }catch(e){writeReport(false,String(e)+' line '+e.line);return 'ERROR: '+e;}
 finally{app.scriptPreferences.measurementUnit=old;}
})();
