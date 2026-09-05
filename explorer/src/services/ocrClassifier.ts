import { createWorker } from 'tesseract.js';
import { GenreTag } from '../types/ocr';

const GENRE_KEYWORDS: Record<GenreTag, string[]> = {
  action: ['fight', 'punch', 'attack', 'battle', 'warrior', 'power', 'kill', 'sword', 'gun', 'strike', 'hero', 'enemy', 'destroy', 'defeat'],
  romance: ['love', 'kiss', 'heart', 'hug', 'date', 'marry', 'boyfriend', 'girlfriend', 'blush', 'crush', 'darling', 'sweetheart', 'tender', 'embrace'],
  comedy: ['haha', 'lol', 'funny', 'laugh', 'joke', 'ridiculous', 'crazy', 'silly', 'gag', 'prank', 'idiot', 'fool', 'hilarious'],
  horror: ['blood', 'death', 'dark', 'demon', 'ghost', 'kill', 'scream', 'fear', 'corpse', 'shadow', 'nightmare', 'evil', 'terror', 'curse', 'monster'],
  fantasy: ['magic', 'spell', 'wizard', 'witch', 'dragon', 'mana', 'dungeon', 'elf', 'kingdom', 'emperor', 'beast', 'guild', 'quest', 'curse', 'reincarnat'],
  'sci-fi': ['robot', 'cyborg', 'space', 'ship', 'laser', 'alien', 'future', 'system', 'tech', 'virtual', 'galaxy', 'planet', 'matrix', 'ai'],
  'slice-of-life': ['school', 'class', 'friend', 'club', 'cook', 'eat', 'home', 'work', 'study', 'festival', 'morning', 'dinner', 'normal', 'everyday'],
  adventure: ['journey', 'travel', 'island', 'treasure', 'explore', 'map', 'voyage', 'sea', 'danger', 'cave', 'ruins', 'discover', 'frontier'],
  drama: ['secret', 'truth', 'betray', 'lie', 'family', 'tears', 'crying', 'sad', 'pain', 'guilt', 'memory', 'forgive', 'promise', 'tragedy']
};

export function classifyTextToGenres(fullText: string): GenreTag[] {
  const lower = fullText.toLowerCase();
  const matchedGenres: { genre: GenreTag; count: number }[] = [];

  for (const [genreKey, keywords] of Object.entries(GENRE_KEYWORDS) as [GenreTag, string[]][]) {
    let count = 0;
    for (const kw of keywords) {
      // Word boundary or substring match
      const regex = new RegExp(`\\b${kw}`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    if (count > 0) {
      matchedGenres.push({ genre: genreKey, count });
    }
  }

  // Sort descending by match count
  matchedGenres.sort((a, b) => b.count - a.count);
  return matchedGenres.slice(0, 4).map(g => g.genre);
}

export async function runOcrOnBlobs(
  blobs: { name: string; blob: Blob }[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<{ text: string; tags: GenreTag[] }> {
  if (blobs.length === 0) {
    return { text: '', tags: [] };
  }

  const worker = await createWorker('eng');
  let combinedText = '';

  try {
    for (let i = 0; i < blobs.length; i++) {
      const item = blobs[i];
      if (onProgress) {
        onProgress(i + 1, blobs.length, item.name);
      }

      try {
        const ret = await worker.recognize(item.blob);
        combinedText += `\n${ret.data.text}`;
      } catch (e) {
        console.warn(`OCR error for ${item.name}:`, e);
      }
    }
  } finally {
    await worker.terminate();
  }

  const tags = classifyTextToGenres(combinedText);
  return { text: combinedText, tags };
}

