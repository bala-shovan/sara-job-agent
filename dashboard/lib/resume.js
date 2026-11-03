// Read a resume in the browser and turn it into plain text for "Your
// experience". The file never leaves the person's device: only the text they
// keep in the box is saved, like anything they type.

const MAX_CHARS = 8000; // roughly 1,200 words; plenty for Sara to judge fit

async function pdfText(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    // Keep line breaks where the PDF has them
    let line = '';
    const lines = [];
    for (const item of content.items) {
      line += item.str;
      if (item.hasEOL) { lines.push(line); line = ''; } else if (item.str && !item.str.endsWith(' ')) line += ' ';
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

async function docxText(buffer) {
  const mammoth = (await import('mammoth/mammoth.browser')).default;
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value;
}

// Remove contact details Sara doesn't need, and tidy whitespace
export function cleanResumeText(text) {
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
    // Phone numbers: international (+...), three-group local, or 11-digit mobile.
    // Year ranges like "2021 - 2024" are left alone.
    .replace(/\+\d[\d\s().-]{7,}\d|\(?\b\d{3,5}\)?[\s.-]\d{3,4}[\s.-]\d{3,5}\b|\b0\d{4}[\s-]?\d{6}\b|\(\d{2,5}\)\s?\d{3,4}[\s.-]?\d{3,5}\b/g, '')
    // Separators left dangling after removals ("· · Dhaka" -> "Dhaka")
    .replace(/^[ \t|•·,;/-]+/gm, '')
    .replace(/[ \t|•·,;/-]+$/gm, '')
    .replace(/([|•·])(\s*[|•·])+/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const RESUME_ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

export async function readResume(file) {
  const name = file.name.toLowerCase();
  if (file.size > 10 * 1024 * 1024) throw new Error('That file is over 10 MB. Try a smaller PDF or Word file.');
  let text;
  if (name.endsWith('.pdf') || file.type === 'application/pdf') text = await pdfText(await file.arrayBuffer());
  else if (name.endsWith('.docx')) text = await docxText(await file.arrayBuffer());
  else if (name.endsWith('.doc')) throw new Error('Old .doc files can\'t be read. Save it as .docx or PDF and try again.');
  else text = await file.text();
  const clean = cleanResumeText(text);
  if (clean.length < 80) throw new Error('Sara couldn\'t find much text in that file. If it\'s a scanned image, paste your experience instead.');
  return { text: clean.slice(0, MAX_CHARS), trimmed: clean.length > MAX_CHARS };
}
