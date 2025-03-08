import { read, write } from "./src/fs.js";
import { getPosts } from "./src/lib.js";
import { post } from "./src/post.js";

const state = (() => {
  try {
    return JSON.parse(read("state.json"));
  } catch (e) {
    console.warn("Could not read state", e.message);
    return {};
  }
})();

fetch(
  "https://www.energex.com.au/static/Energex/energex_po_current_unplanned.geojson"
)
  .then((res) => {
    if (res.status !== 200) {
      throw new Error(`HTTP status ${res.status}`);
    }
    return res.json();
  })
  .then((newJson) => getPosts(newJson, state))
  .then(({ posts, state }) => {
    posts.forEach(post);
    write("state.json", JSON.stringify(state));
  })
  .catch((e) => {
    console.error("hit error", e.message);
    console.error(e);
  });
