import { fileURLToPath } from "url";
import path from "path";
export const __dirname = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../"
);

console.log({ __dirname });
