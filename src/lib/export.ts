/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * the implementation idea is verified,
 * most of the code here is AI generated, following the PNG specification
 */

import { mapStringfyReviver } from "./sync";

export const embedPlanDataInPng = (dataUrl: string, planData: string) => {
  const pngData = dataUrlToUint8Array(dataUrl);
  // write a keyword and text to the png data
  const newPngData = addiTXtChunkToPngBytes(pngData, "AcaMapa", planData);
  const newDataUrl = uint8ArrayToDataUrl(newPngData);

  // read the keyword and text from the png data
  const itxtText = readiTXtTextFromPngBytes(newPngData, "AcaMapa");
  if (!itxtText) {
    throw new Error("Failed to read plan data from PNG");
  }

  const parsedPlanData = JSON.parse(itxtText, mapStringfyReviver);
  console.log(parsedPlanData);

  return newDataUrl;
};

export const parsePlanDataFromPng = (dataUrl: string) => {
  const pngData = dataUrlToUint8Array(dataUrl);
  const itxtText = readiTXtTextFromPngBytes(pngData, "AcaMapa");

  if (!itxtText) {
    throw new Error("Failed to read plan data from PNG");
  }

  const parsedPlanData = JSON.parse(itxtText, mapStringfyReviver);

  return parsedPlanData;
};

// Simple CRC32 implementation according to PNG specification
const CRC_TABLE = (() => {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

// conversion
const toCrc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const dataUrlToUint8Array = (dataUrl: string) => {
  const base64 = dataUrl.substring(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  // unicode values
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const uint8ArrayToDataUrl = (uint8Array: Uint8Array) => {
  let binary = "";

  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }

  return "data:image/png;base64," + btoa(binary);
};

// ASCII-only helper (fine for JSON / simple tags)
const stringToLatin1Bytes = (str: string) => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
};

// UTF-8 encoding for text
const stringToUtf8Bytes = (str: string) => {
  return new TextEncoder().encode(str); // Uint8Array
};

const readUint32BE = (bytes: Uint8Array, offset: number) => {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
};

const latin1BytesToString = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
};

const utf8BytesToString = (bytes: Uint8Array) => {
  return new TextDecoder().decode(bytes);
};

const addiTXtChunkToPngBytes = (
  pngBytes: Uint8Array,
  keyword: string,
  text: string,
) => {
  const out = [];

  // Helpers to write / read
  const writeUint32 = (value: number) => {
    out.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    );
  };
  const writeBytes = (bytes: Uint8Array) => {
    for (let i = 0; i < bytes.length; i++) out.push(bytes[i]);
  };
  const readUint32 = (offset: number) =>
    (pngBytes[offset] << 24) |
    (pngBytes[offset + 1] << 16) |
    (pngBytes[offset + 2] << 8) |
    pngBytes[offset + 3];

  // Copy signature
  for (let i = 0; i < 8; i++) out.push(pngBytes[i]);
  let offset = 8;

  while (offset < pngBytes.length) {
    const length = readUint32(offset);
    offset += 4;
    const typeBytes = pngBytes.slice(offset, offset + 4);
    offset += 4;
    const type = String.fromCharCode(...typeBytes);
    const data = pngBytes.slice(offset, offset + length);
    offset += length;
    const crc = pngBytes.slice(offset, offset + 4);
    offset += 4;

    // Before writing IEND, insert our custom iTXt chunk
    if (type === "IEND") {
      const keywordBytes = stringToLatin1Bytes(keyword); // e.g. "myApp"
      const textBytes = stringToUtf8Bytes(text); // JSON/string payload

      const compressionFlag = 0; // 0 = uncompressed
      const compressionMethod = 0; // must be 0 if not compressed

      // We're leaving language_tag and translated_keyword empty
      const languageTagBytes = new Uint8Array(0);
      const translatedKeywordBytes = new Uint8Array(0);

      const chunkData = new Uint8Array(
        keywordBytes.length +
          1 + // keyword + null
          1 + // compression_flag
          1 + // compression_method
          languageTagBytes.length +
          1 + // language_tag + null (empty)
          translatedKeywordBytes.length +
          1 + // translated_keyword + null (empty)
          textBytes.length, // UTF-8 text
      );

      let p = 0;

      // keyword + null
      chunkData.set(keywordBytes, p);
      p += keywordBytes.length;
      chunkData[p++] = 0;

      // compression_flag + compression_method
      chunkData[p++] = compressionFlag;
      chunkData[p++] = compressionMethod;

      // language_tag (empty) + null
      // (if you ever set a non-empty language tag, write bytes then a 0)
      chunkData[p++] = 0;

      // translated_keyword (empty) + null
      chunkData[p++] = 0;

      // UTF-8 text
      chunkData.set(textBytes, p);

      const iTXtType = new Uint8Array([
        "i".charCodeAt(0),
        "T".charCodeAt(0),
        "X".charCodeAt(0),
        "t".charCodeAt(0),
      ]);

      const crcInput = new Uint8Array(4 + chunkData.length);
      crcInput.set(iTXtType, 0);
      crcInput.set(chunkData, 4);
      const crcValue = toCrc32(crcInput);

      // Write our new iTXt chunk
      writeUint32(chunkData.length);
      writeBytes(iTXtType);
      writeBytes(chunkData);
      writeUint32(crcValue);
    }

    // Write the original chunk
    writeUint32(length);
    writeBytes(typeBytes);
    writeBytes(data);
    writeBytes(crc);

    if (type === "IEND") break;
  }

  return new Uint8Array(out);
};

/**
 * Extract UTF-8 text from an iTXt chunk with a specific keyword.
 * @param {Uint8Array} pngBytes
 * @param {string} targetKeyword
 * @returns {string|null}  text payload, or null if not found
 */
const readiTXtTextFromPngBytes = (
  pngBytes: Uint8Array,
  targetKeyword: string,
) => {
  // PNG signature is 8 bytes
  let offset = 8;

  while (offset < pngBytes.length) {
    const length = readUint32BE(pngBytes, offset);
    offset += 4;
    const typeBytes = pngBytes.slice(offset, offset + 4);
    offset += 4;
    const type = String.fromCharCode(...typeBytes);

    const data = pngBytes.slice(offset, offset + length);
    offset += length;
    offset += 4; // skip CRC

    if (type === "iTXt") {
      let p = 0;

      // 1) keyword (Latin-1) until first 0x00
      while (p < data.length && data[p] !== 0) p++;
      const keywordBytes = data.slice(0, p);
      const keyword = latin1BytesToString(keywordBytes);
      p++; // skip null

      if (keyword !== targetKeyword) {
        // not ours, continue to next chunk
        continue;
      }

      // 2) compression_flag (1 byte) + compression_method (1 byte)
      const compressionFlag = data[p++]; // 0 = uncompressed, 1 = compressed
      const compressionMethod = data[p++]; // usually 0

      // 3) language_tag (UTF-8 string) until 0x00
      const langStart = p;
      while (p < data.length && data[p] !== 0) p++;
      const languageTagBytes = data.slice(langStart, p);
      const languageTag = utf8BytesToString(languageTagBytes);
      p++; // skip null

      // 4) translated_keyword (UTF-8) until 0x00
      const tkStart = p;
      while (p < data.length && data[p] !== 0) p++;
      const translatedKeywordBytes = data.slice(tkStart, p);
      const translatedKeyword = utf8BytesToString(translatedKeywordBytes);
      p++; // skip null

      // 5) remaining bytes are the text field
      const textBytes = data.slice(p);

      if (compressionFlag === 0) {
        // uncompressed UTF-8
        const text = utf8BytesToString(textBytes);
        return text;
      } else {
        // compressed (zlib) – you’d need an inflate lib like pako to handle
        console.warn("Compressed iTXt not supported in this reader.");
        return null;
      }
    }

    if (type === "IEND") break; // no more chunks
  }

  return null;
};
