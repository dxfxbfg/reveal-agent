import { v4 as uuidv4 } from 'uuid';

const MAX_CHUNK_SIZE = 1500;

export function splitIntoChunks(text, source, maxChunkSize = MAX_CHUNK_SIZE) {
  const chunks = [];
  if (!text || text.trim().length === 0) return chunks;

  const sections = text.split(/(?=^## )/m).filter((s) => s.trim());

  if (sections.length <= 1) {
    return splitTextIntoChunks(text, source, maxChunkSize);
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    const lines = section.split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();
    const body = lines.slice(1).join('\n').trim();
    const fullText = body ? `${title}\n${body}` : title;

    if (fullText.length <= maxChunkSize) {
      chunks.push({
        id: `${uuidv4()}`,
        text: fullText,
        metadata: { source, title, sectionIndex: i },
      });
    } else {
      const paragraphs = body.split(/\n\n+/).filter((p) => p.trim());
      let currentChunk = title + '\n';
      let chunkIndex = 0;

      for (const para of paragraphs) {
        if ((currentChunk + para).length > maxChunkSize && currentChunk.length > title.length + 1) {
          chunks.push({
            id: `${uuidv4()}`,
            text: currentChunk.trim(),
            metadata: { source, title: `${title} (part ${chunkIndex + 1})`, sectionIndex: i, chunkIndex },
          });
          currentChunk = title + '\n' + para + '\n';
          chunkIndex++;
        } else {
          currentChunk += para + '\n';
        }
      }

      if (currentChunk.trim().length > title.length) {
        chunks.push({
          id: `${uuidv4()}`,
          text: currentChunk.trim(),
          metadata: { source, title: `${title} (part ${chunkIndex + 1})`, sectionIndex: i, chunkIndex },
        });
      }
    }
  }

  return chunks;
}

export function splitTextIntoChunks(text, source, maxChunkSize = MAX_CHUNK_SIZE) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${uuidv4()}`,
        text: currentChunk.trim(),
        metadata: { source, chunkIndex },
      });
      currentChunk = para;
      chunkIndex++;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `${uuidv4()}`,
      text: currentChunk.trim(),
      metadata: { source, chunkIndex },
    });
  }

  return chunks;
}

export function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9\u4e00-\u9fff]/gi, '_').slice(0, 80);
}