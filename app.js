const els = {
  fileInput: document.querySelector("#fileInput"),
  dropZone: document.querySelector("#dropZone"),
  fileCard: document.querySelector("#fileCard"),
  fileName: document.querySelector("#fileName"),
  fileMeta: document.querySelector("#fileMeta"),
  fileBadge: document.querySelector("#fileBadge"),
  languageSearch: document.querySelector("#languageSearch"),
  ocrLanguage: document.querySelector("#ocrLanguage"),
  languageHint: document.querySelector("#languageHint"),
  autoRead: document.querySelector("#autoRead"),
  progressWrap: document.querySelector("#progressWrap"),
  progressText: document.querySelector("#progressText"),
  progressPercent: document.querySelector("#progressPercent"),
  progressFill: document.querySelector("#progressFill"),
  statusMessage: document.querySelector("#statusMessage"),
  voiceSelect: document.querySelector("#voiceSelect"),
  rateRange: document.querySelector("#rateRange"),
  rateValue: document.querySelector("#rateValue"),
  pitchRange: document.querySelector("#pitchRange"),
  pitchValue: document.querySelector("#pitchValue"),
  readButton: document.querySelector("#readButton"),
  readSelectedButton: document.querySelector("#readSelectedButton"),
  pauseButton: document.querySelector("#pauseButton"),
  resumeButton: document.querySelector("#resumeButton"),
  stopButton: document.querySelector("#stopButton"),
  nowReading: document.querySelector("#nowReading"),
  speechProgress: document.querySelector("#speechProgress"),
  wordCount: document.querySelector("#wordCount"),
  textOutput: document.querySelector("#textOutput"),
  copyButton: document.querySelector("#copyButton"),
  downloadButton: document.querySelector("#downloadButton"),
  clearButton: document.querySelector("#clearButton"),
  manualText: document.querySelector("#manualText"),
  manualWordCount: document.querySelector("#manualWordCount"),
  readManualButton: document.querySelector("#readManualButton"),
  sendManualButton: document.querySelector("#sendManualButton"),
  clearManualButton: document.querySelector("#clearManualButton"),
};

const readableTextExtensions = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "html",
  "htm",
  "rtf",
  "log",
]);

const imageExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "bmp",
  "gif",
  "tif",
  "tiff",
]);

const ocrLanguages = [
  { code: "eng", name: "English", keywords: "english latin" },
  { code: "eng+hin", name: "English + Hindi", keywords: "hinglish hindi devanagari" },
  { code: "hin", name: "Hindi", keywords: "hindi devanagari india" },
  { code: "urd", name: "Urdu", keywords: "urdu pakistan arabic script" },
  { code: "ben", name: "Bengali", keywords: "bengali bangla" },
  { code: "ara", name: "Arabic", keywords: "arabic" },
  { code: "asm", name: "Assamese", keywords: "assamese assam india" },
  { code: "guj", name: "Gujarati", keywords: "gujarati india" },
  { code: "kan", name: "Kannada", keywords: "kannada india" },
  { code: "mal", name: "Malayalam", keywords: "malayalam india" },
  { code: "mar", name: "Marathi", keywords: "marathi india" },
  { code: "nep", name: "Nepali", keywords: "nepali nepal" },
  { code: "ori", name: "Odia", keywords: "odia oriya india" },
  { code: "pan", name: "Punjabi", keywords: "punjabi gurmukhi india" },
  { code: "san", name: "Sanskrit", keywords: "sanskrit devanagari" },
  { code: "sin", name: "Sinhala", keywords: "sinhala sri lanka" },
  { code: "tam", name: "Tamil", keywords: "tamil india sri lanka" },
  { code: "tel", name: "Telugu", keywords: "telugu india" },
  { code: "fra", name: "French", keywords: "french francais" },
  { code: "deu", name: "German", keywords: "german deutsch" },
  { code: "spa", name: "Spanish", keywords: "spanish espanol" },
  { code: "ita", name: "Italian", keywords: "italian italiano" },
  { code: "por", name: "Portuguese", keywords: "portuguese brasil brazil" },
  { code: "nld", name: "Dutch", keywords: "dutch nederlands" },
  { code: "rus", name: "Russian", keywords: "russian cyrillic" },
  { code: "chi_sim", name: "Chinese Simplified", keywords: "chinese simplified mandarin" },
  { code: "chi_tra", name: "Chinese Traditional", keywords: "chinese traditional mandarin" },
  { code: "jpn", name: "Japanese", keywords: "japanese nihongo" },
  { code: "kor", name: "Korean", keywords: "korean hangul" },
  { code: "tur", name: "Turkish", keywords: "turkish" },
  { code: "vie", name: "Vietnamese", keywords: "vietnamese" },
  { code: "ind", name: "Indonesian", keywords: "indonesian bahasa" },
  { code: "tha", name: "Thai", keywords: "thai" },
  { code: "fas", name: "Persian", keywords: "persian farsi" },
  { code: "heb", name: "Hebrew", keywords: "hebrew" },
];

let voices = [];
let speechChunks = [];
let currentChunkIndex = 0;
let activeUtterance = null;
let isReading = false;

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

function setStatus(message, badge = "Ready") {
  els.statusMessage.textContent = message;
  els.fileBadge.textContent = badge;
}

function showProgress(label, percent) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  els.progressWrap.classList.remove("hidden");
  els.progressText.textContent = label;
  els.progressPercent.textContent = `${safePercent}%`;
  els.progressFill.style.width = `${safePercent}%`;
}

function hideProgress() {
  els.progressWrap.classList.add("hidden");
  els.progressFill.style.width = "0%";
  els.progressPercent.textContent = "0%";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function extensionOf(fileName) {
  return fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
}

function countWords(text) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function setExtractedText(text) {
  const cleaned = normalizeText(text);
  els.textOutput.value = cleaned;
  updateWordCount();
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function updateWordCount() {
  const words = countWords(els.textOutput.value);
  els.wordCount.textContent = `${words.toLocaleString()} word${words === 1 ? "" : "s"}`;
}

function updateManualWordCount() {
  const words = countWords(els.manualText.value);
  els.manualWordCount.textContent = `${words.toLocaleString()} word${words === 1 ? "" : "s"}`;
}

function setBusy(isBusy) {
  els.fileInput.disabled = isBusy;
  els.readButton.disabled = isBusy;
  els.readSelectedButton.disabled = isBusy;
  els.copyButton.disabled = isBusy;
  els.downloadButton.disabled = isBusy;
  els.readManualButton.disabled = isBusy;
  els.sendManualButton.disabled = isBusy;
}

function renderOcrLanguages(filter = "") {
  const selected = els.ocrLanguage.value || "eng";
  const query = filter.trim().toLowerCase();
  const matches = ocrLanguages.filter((language) => {
    const haystack = `${language.name} ${language.code} ${language.keywords}`.toLowerCase();
    return !query || haystack.includes(query);
  });
  const list = matches.length ? matches : ocrLanguages.filter((language) => language.code === "eng");

  els.ocrLanguage.innerHTML = "";
  list.forEach((language) => {
    const option = document.createElement("option");
    option.value = language.code;
    option.textContent = `${language.name} (${language.code})`;
    els.ocrLanguage.appendChild(option);
  });

  els.ocrLanguage.value = list.some((language) => language.code === selected) ? selected : list[0].code;
  const chosen = list.find((language) => language.code === els.ocrLanguage.value) || list[0];
  els.languageHint.textContent = matches.length
    ? `${matches.length} language${matches.length === 1 ? "" : "s"} found. Selected: ${chosen.name} (${chosen.code}).`
    : "No exact match found. English is selected as a safe fallback.";
}

async function handleFile(file) {
  if (!file) return;

  stopSpeech();
  setBusy(true);
  setExtractedText("");
  els.fileCard.classList.remove("hidden");
  els.fileName.textContent = file.name;
  els.fileMeta.textContent = `${formatBytes(file.size)} · ${file.type || "Unknown file type"}`;
  setStatus("Reading file and finding text...", "Working");
  showProgress("Starting", 4);

  try {
    const text = await extractTextFromFile(file);
    const cleaned = normalizeText(text);

    if (!cleaned) {
      setStatus(
        "No readable text was found. If this is a scanned document, try uploading a clear screenshot or image.",
        "No text"
      );
      setExtractedText("");
      return;
    }

    setExtractedText(cleaned);
    showProgress("Text ready", 100);
    setStatus(
      `Found ${countWords(cleaned).toLocaleString()} words. You can listen, edit, copy, or download the text.`,
      "Done"
    );

    if (els.autoRead.checked) {
      window.setTimeout(() => speakText(cleaned), 200);
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Something went wrong while reading this file.", "Needs check");
  } finally {
    setBusy(false);
    window.setTimeout(hideProgress, 850);
  }
}

async function extractTextFromFile(file) {
  const ext = extensionOf(file.name);
  const mime = file.type || "";

  if (ext === "pdf" || mime === "application/pdf") {
    return extractPdfText(file);
  }

  if (ext === "docx") {
    return extractDocxText(file);
  }

  if (ext === "pptx") {
    return extractPptxText(file);
  }

  if (ext === "xlsx") {
    return extractXlsxText(file);
  }

  if (imageExtensions.has(ext) || mime.startsWith("image/")) {
    return extractImageText(file);
  }

  if (readableTextExtensions.has(ext) || mime.startsWith("text/")) {
    return extractPlainText(file, ext);
  }

  if (["doc", "ppt", "xls"].includes(ext)) {
    return extractLegacyOfficeText(file, ext);
  }

  return extractUnknownText(file);
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF reader library did not load. Please check your internet connection and reload.");
  }

  showProgress("Opening PDF", 8);
  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    showProgress(`Reading PDF page ${pageNumber} of ${pdf.numPages}`, 8 + (pageNumber / pdf.numPages) * 84);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items.map((item) => item.str).join(" ");
    pages.push(`Page ${pageNumber}\n${line}`);
  }

  return pages.join("\n\n");
}

async function extractDocxText(file) {
  if (!window.mammoth) {
    throw new Error("DOCX reader library did not load. Please check your internet connection and reload.");
  }

  showProgress("Opening DOCX", 12);
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  showProgress("DOCX text ready", 96);
  return result.value;
}

async function extractPptxText(file) {
  if (!window.JSZip) {
    throw new Error("PPTX reader library did not load. Please check your internet connection and reload.");
  }

  showProgress("Opening PPTX", 10);
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(compareNumberedFiles);

  if (!slideFiles.length) return "";

  const sections = [];

  for (let index = 0; index < slideFiles.length; index += 1) {
    const name = slideFiles[index];
    showProgress(`Reading slide ${index + 1} of ${slideFiles.length}`, 12 + ((index + 1) / slideFiles.length) * 80);
    const xml = await zip.file(name).async("text");
    const slideText = textFromXmlTags(xml, ["a:t"]);
    const notesName = `ppt/notesSlides/notesSlide${numberFromFile(name)}.xml`;
    const notesText = zip.file(notesName) ? textFromXmlTags(await zip.file(notesName).async("text"), ["a:t"]) : "";
    sections.push([`Slide ${index + 1}`, slideText, notesText ? `Speaker notes: ${notesText}` : ""].filter(Boolean).join("\n"));
  }

  return sections.join("\n\n");
}

async function extractXlsxText(file) {
  if (!window.JSZip) {
    throw new Error("XLSX reader library did not load. Please check your internet connection and reload.");
  }

  showProgress("Opening XLSX", 10);
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const sharedStrings = await readSharedStrings(zip);
  const sheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort(compareNumberedFiles);
  const sheets = [];

  for (let index = 0; index < sheetFiles.length; index += 1) {
    const fileName = sheetFiles[index];
    showProgress(`Reading sheet ${index + 1} of ${sheetFiles.length}`, 14 + ((index + 1) / sheetFiles.length) * 78);
    const xml = await zip.file(fileName).async("text");
    sheets.push(`Sheet ${index + 1}\n${textFromWorksheet(xml, sharedStrings)}`);
  }

  return sheets.join("\n\n");
}

async function readSharedStrings(zip) {
  const shared = zip.file("xl/sharedStrings.xml");
  if (!shared) return [];
  const xml = await shared.async("text");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName("si")).map((node) =>
    Array.from(node.getElementsByTagName("t"))
      .map((textNode) => textNode.textContent)
      .join("")
  );
}

function textFromWorksheet(xml, sharedStrings) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const rows = Array.from(doc.getElementsByTagName("row"));

  return rows
    .map((row) => {
      const cells = Array.from(row.getElementsByTagName("c")).map((cell) => {
        const type = cell.getAttribute("t");
        if (type === "inlineStr") {
          return Array.from(cell.getElementsByTagName("t"))
            .map((node) => node.textContent)
            .join("");
        }

        const value = cell.getElementsByTagName("v")[0]?.textContent || "";
        if (type === "s") return sharedStrings[Number(value)] || "";
        return value;
      });
      return cells.filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

async function extractImageText(file) {
  if (!window.Tesseract) {
    throw new Error("OCR library did not load. Please check your internet connection and reload.");
  }

  showProgress("Starting OCR", 5);
  const language = els.ocrLanguage.value;
  const result = await window.Tesseract.recognize(file, language, {
    logger(message) {
      if (message.status) {
        const percent = message.progress ? message.progress * 100 : 8;
        showProgress(`OCR: ${message.status}`, percent);
      }
    },
  });

  return result.data.text;
}

async function extractPlainText(file, ext) {
  showProgress("Reading text file", 32);
  const text = await file.text();

  if (ext === "html" || ext === "htm") {
    return new DOMParser().parseFromString(text, "text/html").body.textContent || "";
  }

  if (ext === "rtf") {
    return stripRtf(text);
  }

  return text;
}

async function extractLegacyOfficeText(file, ext) {
  showProgress(`Trying old ${ext.toUpperCase()} format`, 22);
  const arrayBuffer = await file.arrayBuffer();
  const decoded = [
    safeDecode(arrayBuffer, "utf-16le"),
    safeDecode(arrayBuffer, "windows-1252"),
    safeDecode(arrayBuffer, "utf-8"),
  ].join("\n");
  const cleaned = decoded
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\u0900-\u097f]+/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && /[A-Za-z0-9\u0900-\u097f]/.test(line))
    .join("\n");

  return [
    `Best-effort text from old .${ext} file. For cleaner reading, save the file as .${ext}x and upload again.`,
    cleaned,
  ].join("\n\n");
}

async function extractUnknownText(file) {
  showProgress("Trying to read unknown file", 28);
  try {
    return await file.text();
  } catch {
    throw new Error("This file type could not be read in the browser. Try PDF, DOCX, PPTX, XLSX, TXT, or an image.");
  }
}

function safeDecode(arrayBuffer, encoding) {
  try {
    return new TextDecoder(encoding).decode(arrayBuffer);
  } catch {
    return "";
  }
}

function stripRtf(text) {
  return text
    .replace(/\\par[d]?/gi, "\n")
    .replace(/\\tab/gi, "\t")
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/[{}]/g, "")
    .replace(/\\[a-z]+\d* ?/gi, "")
    .replace(/\\[^a-z]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textFromXmlTags(xml, tagNames) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return tagNames
    .flatMap((tag) => Array.from(doc.getElementsByTagName(tag)))
    .map((node) => node.textContent)
    .filter(Boolean)
    .join(" ");
}

function numberFromFile(fileName) {
  const match = fileName.match(/(\d+)\.xml$/);
  return match ? Number(match[1]) : 0;
}

function compareNumberedFiles(a, b) {
  return numberFromFile(a) - numberFromFile(b);
}

function populateVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  els.voiceSelect.innerHTML = "";

  if (!voices.length) {
    const option = document.createElement("option");
    option.textContent = "Default browser voice";
    option.value = "";
    els.voiceSelect.appendChild(option);
    return;
  }

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? " - default" : ""}`;
    els.voiceSelect.appendChild(option);
  });
}

function selectedVoice() {
  const index = Number(els.voiceSelect.value);
  return Number.isFinite(index) ? voices[index] : null;
}

function makeSpeechChunks(text) {
  const sentences = normalizeText(text)
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  if (!sentences) return [];

  const chunks = [];
  let buffer = "";

  sentences.forEach((sentence) => {
    const part = sentence.trim();
    if (!part) return;

    if ((buffer + " " + part).trim().length > 1300) {
      if (buffer) chunks.push(buffer.trim());
      buffer = part;
    } else {
      buffer = `${buffer} ${part}`.trim();
    }
  });

  if (buffer) chunks.push(buffer.trim());
  return chunks;
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    setStatus("This browser does not support voice reading. Try Chrome, Edge, or Safari.", "No voice");
    return;
  }

  const cleaned = normalizeText(text);
  if (!cleaned) {
    setStatus("There is no text to read yet. Upload a file first.", "No text");
    return;
  }

  stopSpeech(false);
  speechChunks = makeSpeechChunks(cleaned);
  currentChunkIndex = 0;
  isReading = true;
  els.speechProgress.style.width = "0%";
  setStatus("Reading aloud...", "Speaking");
  speakNextChunk();
}

function speakNextChunk() {
  if (!isReading || currentChunkIndex >= speechChunks.length) {
    finishSpeech();
    return;
  }

  const chunk = speechChunks[currentChunkIndex];
  const utterance = new SpeechSynthesisUtterance(chunk);
  const voice = selectedVoice();

  if (voice) utterance.voice = voice;
  utterance.rate = Number(els.rateRange.value);
  utterance.pitch = Number(els.pitchRange.value);

  activeUtterance = utterance;
  els.nowReading.textContent = chunk;
  els.speechProgress.style.width = `${(currentChunkIndex / speechChunks.length) * 100}%`;

  utterance.onend = () => {
    currentChunkIndex += 1;
    speakNextChunk();
  };

  utterance.onerror = (event) => {
    console.warn("Speech error", event);
    setStatus("Voice playback stopped. Try pressing Read all again.", "Stopped");
    finishSpeech();
  };

  window.speechSynthesis.speak(utterance);
}

function finishSpeech() {
  isReading = false;
  activeUtterance = null;
  els.speechProgress.style.width = speechChunks.length ? "100%" : "0%";
  els.nowReading.textContent = speechChunks.length ? "Finished reading." : "Nothing is playing yet.";
  setStatus(els.textOutput.value ? "Reading finished. You can replay or edit the text." : "Waiting for a file.", "Ready");
}

function stopSpeech(updateStatus = true) {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isReading = false;
  activeUtterance = null;
  speechChunks = [];
  currentChunkIndex = 0;
  els.speechProgress.style.width = "0%";
  els.nowReading.textContent = "Nothing is playing yet.";
  if (updateStatus) setStatus(els.textOutput.value ? "Voice stopped." : "Waiting for a file.", "Ready");
}

function selectedText() {
  const start = els.textOutput.selectionStart;
  const end = els.textOutput.selectionEnd;
  return start !== end ? els.textOutput.value.slice(start, end) : "";
}

function readManualText() {
  const text = els.manualText.value.trim();
  if (!text) {
    setStatus("Write or paste text in the typing area first.", "No text");
    return;
  }
  speakText(text);
}

function sendManualTextToReader() {
  const text = els.manualText.value.trim();
  if (!text) {
    setStatus("Write or paste text in the typing area first.", "No text");
    return;
  }
  setExtractedText(text);
  setStatus("Typed text moved to the extracted text reader.", "Ready");
}

function clearManualText() {
  els.manualText.value = "";
  updateManualWordCount();
  setStatus(els.textOutput.value ? "Typed text cleared." : "Waiting for a file or typed text.", "Ready");
}

async function copyExtractedText() {
  const text = els.textOutput.value.trim();
  if (!text) {
    setStatus("There is no text to copy yet.", "No text");
    return;
  }
  await navigator.clipboard.writeText(text);
  setStatus("Extracted text copied to clipboard.", "Copied");
}

function downloadExtractedText() {
  const text = els.textOutput.value.trim();
  if (!text) {
    setStatus("There is no text to download yet.", "No text");
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "extracted-text-for-reading.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setStatus("Text file downloaded.", "Downloaded");
}

function clearAll() {
  stopSpeech(false);
  els.fileInput.value = "";
  els.fileCard.classList.add("hidden");
  els.textOutput.value = "";
  els.manualText.value = "";
  updateWordCount();
  updateManualWordCount();
  hideProgress();
  setStatus("Waiting for a file.", "Ready");
}

els.fileInput.addEventListener("change", (event) => {
  handleFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => {
  handleFile(event.dataTransfer.files[0]);
});

els.readButton.addEventListener("click", () => speakText(els.textOutput.value));
els.readSelectedButton.addEventListener("click", () => {
  const text = selectedText();
  speakText(text || els.textOutput.value);
});
els.pauseButton.addEventListener("click", () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
    setStatus("Voice paused.", "Paused");
  }
});
els.resumeButton.addEventListener("click", () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    setStatus("Reading aloud...", "Speaking");
  }
});
els.stopButton.addEventListener("click", () => stopSpeech(true));
els.copyButton.addEventListener("click", copyExtractedText);
els.downloadButton.addEventListener("click", downloadExtractedText);
els.clearButton.addEventListener("click", clearAll);
els.textOutput.addEventListener("input", updateWordCount);
els.manualText.addEventListener("input", updateManualWordCount);
els.readManualButton.addEventListener("click", readManualText);
els.sendManualButton.addEventListener("click", sendManualTextToReader);
els.clearManualButton.addEventListener("click", clearManualText);
els.languageSearch.addEventListener("input", () => renderOcrLanguages(els.languageSearch.value));
els.ocrLanguage.addEventListener("change", () => renderOcrLanguages(els.languageSearch.value));
els.rateRange.addEventListener("input", () => {
  els.rateValue.textContent = `${Number(els.rateRange.value).toFixed(1)}x`;
});
els.pitchRange.addEventListener("input", () => {
  els.pitchValue.textContent = Number(els.pitchRange.value).toFixed(1);
});

if ("speechSynthesis" in window) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
} else {
  setStatus("This browser does not support voice reading. Try Chrome, Edge, or Safari.", "No voice");
}

renderOcrLanguages();
updateWordCount();
updateManualWordCount();
