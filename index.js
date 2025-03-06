import { createRestAPIClient } from "masto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secrets = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./secrets.json"))
);
function doFetch() {
  return fetch(
    "https://www.energex.com.au/static/Energex/energex_po_current_unplanned.geojson"
  ).then((res) => res.json());
}

function parseIncident(incident) {
  const { EVENT_ID, CUSTOMERS_AFFECTED, REASON, STATUS, SUBURBS } =
    incident.properties;
  const lowercaseReason = REASON.toLowerCase();
  let unifiedReason = "other";
  if (lowercaseReason.includes("investigation")) {
    unifiedReason = "TBD";
  }

  if (lowercaseReason.includes("flood")) {
    unifiedReason = "flooding";
  }
  if (lowercaseReason.includes("tree")) {
    unifiedReason = "trees on lines";
  }
  if (lowercaseReason.includes("down")) {
    unifiedReason = "lines down";
  }
  if (
    lowercaseReason.includes("weather") ||
    lowercaseReason.includes("emergency") ||
    lowercaseReason.includes("cyclone")
  ) {
    unifiedReason = "cyclone damage";
  }

  if (unifiedReason === "other") {
    console.log("unknown reason", REASON);
  }

  return {
    id: EVENT_ID,
    customersAffected: Number(CUSTOMERS_AFFECTED),
    reason: REASON,
    suburbs: SUBURBS,
    status: STATUS,
    unifiedReason,
    incident: incident,
  };
}

function parse(geojson) {
  const incidentCount = geojson.features.length;
  const parsedIncidents = geojson.features.map(parseIncident);

  const incidentTypes = parsedIncidents.reduce(
    (obj, incident) => ({
      ...obj,
      [incident.unifiedReason]: (obj[incident.unifiedReason] || 0) + 1,
    }),
    {}
  );
  const affectedCustomers = parsedIncidents.reduce(
    (count, incident) => count + incident.customersAffected,
    0
  );

  return { incidentCount, incidentTypes, affectedCustomers, parsedIncidents };
}

function post(status) {
  const masto = createRestAPIClient({
    url: "https://mastodon.social",
    accessToken: secrets.accessToken,
  });

  console.log("tooting", status);

  return masto.v1.statuses
    .create({
      status: status,
      visibility: "unlisted",
    })
    .catch((e) => {
      console.error("couldn't post", e.message);
    });
}

function postIncident(incident) {
  const toot = `New power outage out for ${incident.customersAffected} customers at ${incident.suburbs}: ${incident.reason}`;

  return post(toot);
}

let seenIncidents = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "./seenIncidents.json"))
    );
  } catch (e) {
    return null;
  }
})();

let state = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "./state.json")));
  } catch (e) {
    return { seenIncidents };
  }
})();

function pluralise(count, singular, plural) {
  if (count === 1) {
    return singular;
  }
  return plural;
}

async function go() {
  const json = await doFetch();
  //   const json = JSON.parse(fs.readFileSync("./example.json"));
  const { incidentCount, incidentTypes, affectedCustomers, parsedIncidents } =
    parse(json);

  if (!state.seenIncidents) {
    state.seenIncidents = parsedIncidents.map((incident) => incident.id);
  }

  const newIncidents = parsedIncidents.filter(
    (incident) => !state.seenIncidents.includes(incident.id)
  );

  console.log(newIncidents.length, "new incidents");
  state.seenIncidents.push(...newIncidents.map((incident) => incident.id));
  const shouldPostSummary =
    newIncidents.length &&
    (!state.lastSummary || state.lastSummary < Date.now() - 1000 * 60 * 10);
  if (shouldPostSummary) {
    state.lastSummary = Date.now();
  }
  fs.writeFileSync(
    path.resolve(__dirname, "./seenIncidents.json"),
    JSON.stringify(state.seenIncidents)
  );
  fs.writeFileSync(
    path.resolve(__dirname, "./state.json"),
    JSON.stringify(state)
  );

  if (!newIncidents.length) {
    return;
  }
  newIncidents.forEach(postIncident);

  if (shouldPostSummary) {
    const summary = `${incidentCount} ${pluralise(
      incidentCount,
      "incident",
      "incidents"
    )}, ${affectedCustomers} ${pluralise(
      affectedCustomers,
      "customer",
      "customers"
    )} without power. Causes: ${Object.entries(incidentTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ")}.`;
    post(summary);
  } else {
    console.log(
      "not posting summary because last post was",
      (Date.now() - state.lastSummary) / 1000 / 60,
      "minutes ago"
    );
  }
}

console.log("Starting fetch", new Date());
go();
