const fs=require('fs'), pako=require('pako'), kiwi=require('kiwi-schema');
function dec(file){
  const html=fs.readFileSync(file,'utf8');
  const g=(a,b)=>html.substring(html.indexOf(a)+a.length, html.indexOf(b));
  const meta=JSON.parse(Buffer.from(g('<!--(figmeta)','(/figmeta)-->'),'base64').toString());
  const buf=new Uint8Array(Buffer.from(g('<!--(figma)','(/figma)-->'),'base64'));
  const dv=new DataView(buf.buffer); const prelude=Buffer.from(buf.slice(0,8)).toString(); const ver=dv.getUint32(8,true);
  let off=12; const files=[]; while(off+4<buf.length){const n=dv.getUint32(off,true); off+=4; files.push(buf.slice(off,off+n)); off+=n;}
  const zstd = files[1][0]===0x28&&files[1][1]===0xb5;
  const schema=kiwi.decodeBinarySchema(pako.inflateRaw(files[0]));
  const c=kiwi.compileSchema(schema);
  // Figma writes the data chunk as zstd since schema ~v106 (magic 28 b5 2f fd); older payloads use raw deflate
  const data=zstd?require('zlib').zstdDecompressSync(Buffer.from(files[1])):pako.inflateRaw(files[1]);
  const msg=c.decodeMessage(new Uint8Array(data));
  return {meta,prelude,ver,nfiles:files.length,zstd,schema,msg,head:Array.from(files[1].slice(0,4))};
}
module.exports=dec;
if(require.main===module){
  const r=dec(process.argv[2]);
  console.log(JSON.stringify({meta:r.meta,prelude:r.prelude,ver:r.ver,nfiles:r.nfiles,zstd:r.zstd,head:r.head, ndefs:r.schema.definitions.length}));
  const m={...r.msg}; 
  console.log(JSON.stringify(m,(k,v)=> (v instanceof Uint8Array)? `<bytes ${v.length}>`:v,1).slice(0,9000));
}
