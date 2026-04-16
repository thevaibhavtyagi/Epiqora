/**
 * Image Validator Service
 * Validates image files for format, size, and basic quality using Magic Bytes
 */

import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function validateImage(imageBuffer, providedMimeType) {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      return { success: false, error: 'No image data provided', code: 'NO_IMAGE_DATA' };
    }

    if (imageBuffer.length > MAX_FILE_SIZE) {
      return { success: false, error: `Image file is too large.`, code: 'FILE_TOO_LARGE' };
    }

    // DIAGNOSTIC LOGGING: See exactly what the server receives
    const magicBytes = imageBuffer.toString('hex', 0, 8);
    console.log(`[Validator] Received file. Size: ${imageBuffer.length} bytes. Magic Bytes (Hex): ${magicBytes}`);

    const realMimeType = detectMimeType(imageBuffer);

    if (!realMimeType || !ALLOWED_MIME_TYPES.includes(realMimeType)) {
      console.error(`[Validator] Rejected! Detected: ${realMimeType}. Provided: ${providedMimeType}`);
      return {
        success: false,
        error: `Unsupported or corrupted image format. Please use a valid JPEG, PNG, or WebP file.`,
        code: 'INVALID_FORMAT',
      };
    }

    console.log(`[Validator] File validated successfully as ${realMimeType}`);
    return {
      success: true,
      message: 'Image validation successful',
      code: 'VALIDATION_SUCCESS',
      mimeType: realMimeType
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return { success: false, error: 'An error occurred during image validation', code: 'VALIDATION_ERROR' };
  }
}

function detectMimeType(buffer) {
  if (buffer.length < 4) return null;
  const hex = buffer.toString('hex', 0, 4).toLowerCase();

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (hex === '89504e47') return 'image/png';
  // WebP: RIFF ... WEBP
  if (buffer.length >= 12) {
    const riff = buffer.toString('utf8', 0, 4) === 'RIFF';
    const webp = buffer.toString('utf8', 8, 12) === 'WEBP';
    if (riff && webp) return 'image/webp';
  }
  return null;
}

export function getImageDimensions(buffer, mimeType) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return getJpegDimensions(buffer);
  if (mimeType === 'image/png') return getPngDimensions(buffer);
  return { width: null, height: null };
}

function getJpegDimensions(buffer) {
  let pos = 2;
  while (pos < buffer.length) {
    if (buffer[pos] === 0xff) {
      const marker = buffer[pos + 1];
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: (buffer[pos + 5] << 8) | buffer[pos + 6], width: (buffer[pos + 7] << 8) | buffer[pos + 8] };
      }
      pos += ((buffer[pos + 2] << 8) | buffer[pos + 3]) + 2;
    } else {
      pos++;
    }
  }
  return { width: null, height: null };
}

function getPngDimensions(buffer) {
  if (buffer.length < 24) return { width: null, height: null };
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}