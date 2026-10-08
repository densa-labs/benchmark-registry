import re
import xml.etree.ElementTree as ET
import zipfile

NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def col(ref):
    n=0
    for ch in re.match(r'[A-Z]+',ref).group(0): n=n*26+ord(ch)-64
    return n-1
def read(path):
    z=zipfile.ZipFile(path)
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS):
            ss.append(''.join(t.text or '' for t in si.iter(f"{{{NS['m']}}}t")))
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rmap={r.get('Id'):r.get('Target') for r in rels}
    out={}
    for sh in wb.find('m:sheets',NS):
        target=rmap[sh.get(f"{{{NS['r']}}}id")]
        target=target if target.startswith('xl/') else 'xl/'+target.lstrip('/')
        root=ET.fromstring(z.read(target)); rows=[]
        for row in root.iter(f"{{{NS['m']}}}row"):
            cells={}
            for c in row.findall('m:c',NS):
                v=c.find('m:v',NS); t=c.get('t')
                if t=='s' and v is not None: val=ss[int(v.text)]
                elif t=='inlineStr': val=''.join(x.text or '' for x in c.iter(f"{{{NS['m']}}}t"))
                else: val=v.text if v is not None else None
                cells[col(c.get('r'))]=val
            if cells: rows.append([cells.get(i) for i in range(max(cells)+1)])
        out[sh.get('name')]=rows
    return out
