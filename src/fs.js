import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function read(file) {
  return fs.readFileSync(path.resolve(__dirname, "../", file));
}

export function write(file, contents) {
  return fs.writeFileSync(path.resolve(__dirname, "../", file), contents);
}
