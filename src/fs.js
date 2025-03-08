import fs from "fs";
import path from "path";
import { __dirname } from "./utils.js";

export function read(file) {
  return fs.readFileSync(path.resolve(__dirname, file));
}

export function write(file, contents) {
  return fs.writeFileSync(path.resolve(__dirname, file), contents);
}
