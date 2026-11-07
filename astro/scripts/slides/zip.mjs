import { deflateRawSync } from 'node:zlib';

const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=(bytes)=>{let c=0xffffffff;for(const b of bytes)c=(table[(c^b)&255]^(c>>>8))>>>0;return (c^0xffffffff)>>>0;};
/** Deterministic ZIP32, using only Node built-ins; no browser or packaging dependency. */
export function zip(entries) {
  const local=[],central=[];let offset=0;
  if(entries.length>65535)throw new Error('ZIP32 entry limit exceeded');
  for(const {name,source} of entries) {
    const filename=Buffer.from(name),raw=Buffer.from(source),packed=deflateRawSync(raw),crc=crc32(raw);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);
    header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(packed.length,18);
    header.writeUInt32LE(raw.length,22);header.writeUInt16LE(filename.length,26);
    local.push(header,filename,packed);
    const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);
    record.writeUInt16LE(0x800,8);record.writeUInt16LE(8,10);record.writeUInt16LE(33,14);record.writeUInt32LE(crc,16);
    record.writeUInt32LE(packed.length,20);record.writeUInt32LE(raw.length,24);record.writeUInt16LE(filename.length,28);record.writeUInt32LE(offset,42);
    central.push(record,filename);offset+=header.length+filename.length+packed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
