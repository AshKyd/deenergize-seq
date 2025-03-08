import { createRestAPIClient } from "masto";
import { BskyAgent } from "@atproto/api";
import { read } from "./fs.js";
const secrets = JSON.parse(read("secrets.json"));
export async function post(status) {
  const masto = createRestAPIClient({
    url: "https://mastodon.social",
    accessToken: secrets.accessToken,
  });

  console.log("tooting", status);

  masto.v1.statuses
    .create({
      status: status,
      visibility: "unlisted",
    })
    .catch((e) => {
      console.error("couldn't post to mastodon", e.message);
    });

  const agent = new BskyAgent({
    service: "https://bsky.social",
  });
  agent
    .login({
      identifier: secrets.bskyUser,
      password: secrets.bskyPass,
    })
    .then(() =>
      agent.post({
        text: status,
        createdAt: new Date().toISOString(),
      })
    )
    .catch((e) => {
      console.log("couldn't post to bsky", e.message);
    });
}
