import type { VercelRequest } from '@vercel/node';
import formidable from 'formidable';
import type { File as FormidableFile } from 'formidable';

export interface ParsedForm {
  fields: Record<string, string>;
  files: Record<string, FormidableFile>;
}

/** Parses a multipart/form-data request. Requires `export const config = { api: { bodyParser: false } }` in the route file. */
export function parseForm(req: VercelRequest, maxFileSizeBytes = 15 * 1024 * 1024): Promise<ParsedForm> {
  const form = formidable({ maxFileSize: maxFileSizeBytes });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      const flatFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value && value.length > 0) flatFields[key] = value[0];
      }
      const flatFiles: Record<string, FormidableFile> = {};
      for (const [key, value] of Object.entries(files)) {
        if (value && value.length > 0) flatFiles[key] = value[0];
      }
      resolve({ fields: flatFields, files: flatFiles });
    });
  });
}
