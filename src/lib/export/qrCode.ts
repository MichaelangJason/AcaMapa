import pako from "pako";
import { mapStringfyReplacer, mapStringfyReviver } from "../sync";
import type { Plan, Term } from "@/types/db";
import { cloneExportInfo } from "./utils";
import QRCode from "qrcode";
import jsQR from "jsqr";

const PREFIX = "acamapa:";

export const compressExportInfo = (data: any) => {
  const json = PREFIX + JSON.stringify(data, mapStringfyReplacer);
  // use level 9 for utf-8 encoding
  const compressed = pako.deflate(json, { level: 9 });
  return compressed;
};

export const decompressExportInfo = (compressed: Uint8Array<ArrayBuffer>) => {
  const decompressed = pako.inflate(compressed, { to: "string" });
  return decompressed;
};

export const exportInfoToQRCodeDataUrl = async (plan: Plan, terms: Term[]) => {
  const clonedInfo = cloneExportInfo(plan, terms);
  const compressed = compressExportInfo(clonedInfo);

  const dataUrl = await QRCode.toDataURL(
    [
      {
        data: compressed,
        mode: "byte",
      },
    ],
    {
      // margin: 0,
      // errorCorrectionLevel: "H",
      color: {
        light: "#ffffff",
        dark: "#616161",
      },
    },
  );

  return dataUrl;
};

export const importQRCodeFromImage = async (dataUrl: string) => {
  // load image from data url
  const img = new Image();
  img.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
  });

  // draw to canvas to get ImageData
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // scane QR Code from ImageData
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

  if (!qrCode || !qrCode.binaryData) throw new Error("No QR Code found");

  return qrCode.binaryData;
};

export const parseQRCodeData = (compressed: Uint8Array<ArrayBuffer>) => {
  try {
    const decompressedData = decompressExportInfo(compressed);
    if (!decompressedData.startsWith(PREFIX))
      throw new Error("Invalid QR Code data");

    const textData = decompressedData.slice(PREFIX.length);
    const json = JSON.parse(textData, mapStringfyReviver);

    return json;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to parse QR Code data");
  }
};
