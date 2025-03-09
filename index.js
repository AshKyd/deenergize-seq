import child_process from "child_process";
import { read, write } from "./src/fs.js";
import { getPosts } from "./src/lib.js";
import { post } from "./src/post.js";
import { __dirname } from "./src/utils.js";

const existingState = (() => {
  try {
    return JSON.parse(read("state.json"));
  } catch (e) {
    console.warn("Could not read state", e.message);
    return {};
  }
})();

console.log("Checking…", new Date());
console.time("Fetching json");
try {
  child_process.execSync(
    'wget "https://raw.githubusercontent.com/drzax/ausgrid-outages/refs/heads/main/energex-summary-suburbs.json" -O latest-text.json --timeout 20 --compression=auto',
    { cwd: __dirname }
  );
} catch (e) {
  console.error(`Could not fetch json. ${e.message}`);
  process.exit();
}
console.timeEnd("Fetching json");
const newJson = JSON.parse(read("latest-text.json")).data;
const { posts, state } = getPosts(newJson, existingState);

(async () => {
  for (let thisPost of posts) {
    await post(thisPost);
  }
  write("state.json", JSON.stringify(state));
})();
