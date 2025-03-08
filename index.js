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
    'wget "https://www.energex.com.au/static/Energex/energex_po_current_unplanned.geojson" -O latest.json --timeout 180 --compression=type',
    { cwd: __dirname }
  );
} catch (e) {
  console.error(`Could not fetch json. ${e.message}`);
  process.exit();
}
console.timeEnd("Fetching json");
try {
  const newJson = JSON.parse(read("latest.json"));
  const { posts, state } = getPosts(newJson, existingState);
  posts.forEach(post);
  write("state.json", JSON.stringify(state));
} catch (e) {
  console.error("error: ", e.message);
}
