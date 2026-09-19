#!/usr/bin/env node
import fs from "node:fs";
const data=JSON.parse(fs.readFileSync('/tmp/civil-code-131-1948.clean.json','utf8'));
const report=JSON.parse(fs.readFileSync('/tmp/civil-code-131-1948.clean-report.json','utf8'));
const byIndex=new Map(report.changes.map(x=>[x.chunk_index,x]));
const sampleIndices=[0,1,2,3,4,5,10,20,40,81,141,198,391,545,675,789,855,880,966,1084,1092];
const lines=[
'# تقرير مراجعة بشرية — القانون المدني التجريبي',
'',
'> هذا التقرير تقني فقط. الوثيقة ثانوية، `is_test_only=true`، وحالتها `parsed`. لا يجوز استخدامه لاعتماد قانون أو للإجابة القانونية.',
'',
'## بيانات المصدر',
'',
`- المصدر: https://manshurat.org/sites/default/files/law-131-1948.pdf`,
`- SHA-256: ${data.source_sha256}`,
`- عدد الـChunks: ${data.chunk_count}`,
`- الـChunks التي تغيرت بخريطة OCR صريحة: ${report.changes.length}`,
`- التشوهات المتبقية آلياً: ${report.remaining_suspicious_chunks.length}`,
`- حالة الاعتماد: parsed / test_only`,
'',
'## قرار المراجعة المطلوب',
'',
'راجع العينات التالية مقابل صفحات PDF الأصلية، وسجل لكل عينة: صحيح، يحتاج تعديل، أو غير قابل للتحقق. لا تعتمد الوثيقة إذا وُجد اختلاف في نص مادة أو تاريخ أو ترقيم.',
'',
'## عينة المراجعة',
'',
'| Chunk | المادة | سبب الاختيار | النص المنظف |',
'|---:|---:|---|---|',
];
for(const i of sampleIndices){const c=data.chunks[i];if(!c)continue;const reason=byIndex.has(i)?'تغييرات OCR صريحة':'عينة موضعية';lines.push(`| ${i} | ${c.article_number} | ${reason} | ${c.content.replace(/\n/g,' ').replace(/\|/g,'\\|').slice(0,900)} |`)}
lines.push('', '## خريطة التصحيح', '', '| من | إلى | مرات التطبيق |', '|---|---|---:|');
const counts=new Map();for(const c of report.changes)for(const r of c.replacements){const k=`${r.from}|||${r.to}`;counts.set(k,(counts.get(k)||0)+1)}
for(const [k,n] of counts){const [from,to]=k.split('|||');lines.push(`| ${from} | ${to} | ${n} |`)}
lines.push('', '## لا تعتمد قبل هذه الخطوات', '', '1. مطابقة العينات مع المصدر الأصلي.', '2. فحص المواد التي تغيرت بخريطة OCR.', '3. تسجيل اسم المراجع وتاريخ المراجعة وملاحظاته في `legal_document_reviews`.', '4. توفير النسخة الرسمية أو توثيق سبب قبول النسخة الثانوية للاختبارات فقط.', '5. إبقاء `is_test_only=true` وعدم تحويل الحالة إلى `published` قبل تحقق المصدر الرسمي.');
fs.writeFileSync('/home/ubuntu/axia-legal/docs/LEGAL_PILOT_REVIEW.md',lines.join('\n')+'\n');
console.log(JSON.stringify({path:'/home/ubuntu/axia-legal/docs/LEGAL_PILOT_REVIEW.md',sample_count:sampleIndices.length,changed_chunks:report.changes.length},null,2));
