# File to Voice Reader AI

This website lets a user upload a document or screenshot, extracts the written text, and reads it aloud with the browser's voice engine.

<img width="1883" height="946" alt="file to voice" src="https://github.com/user-attachments/assets/01803c24-77fe-4e3b-bf1f-dc7c6852e8fe" />


## How to use

1. Open `index.html` in a browser, or run a small local server and open the page.
2. Upload a file by clicking the upload area or dragging a file into it.
3. Wait while the text is extracted.
4. The app can start reading automatically, or you can press `Read all`.
5. Search and choose the OCR language before uploading screenshots or images.
6. Edit the extracted text if needed, then use `Read selected`, `Copy text`, or `Download .txt`.
7. Use the `Type your own text` area to write or paste text and listen to it without uploading a file.

## Supported files

Reliable extraction:

- PDF
- DOCX
- PPTX
- XLSX
- TXT, CSV, Markdown, JSON, XML, HTML, RTF
- Screenshot and image files: PNG, JPG, JPEG, WEBP, BMP, GIF, TIFF

Best-effort extraction:

- Old binary DOC, PPT, and XLS files. These formats are difficult to read cleanly in a browser. For best results, open the file in Microsoft Office or LibreOffice, save it as DOCX, PPTX, or XLSX, then upload again.

## Privacy

The page does not upload files to a server. Text extraction happens in the browser, and voice playback uses the browser's built-in `speechSynthesis` voice system.

Some reader libraries are loaded from public CDNs when the page opens:

- PDF.js for PDF reading
- Mammoth.js for DOCX reading
- JSZip for PPTX and XLSX reading
- Tesseract.js for screenshot OCR
- Three.js for the animated 3D background

An internet connection is needed for those libraries to load the first time.

## Best results

- Use clear, high-resolution screenshots for OCR.
- Use searchable PDFs when available.
- Convert old `.doc`, `.ppt`, and `.xls` files to modern Office formats before uploading.
- If reading does not start automatically, press `Read all`. Some browsers require a user click before voice playback.
