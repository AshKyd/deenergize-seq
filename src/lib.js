/** 1 hr between summary posts */
const SUMMARY_TIME = 1000 * 60 * 60;

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

function pluralise(count, singular, plural) {
  if (count === 1) {
    return singular;
  }
  return plural;
}

export function getPosts(json, state) {
  console.log("Starting fetch", new Date());
  //   const json = JSON.parse(fs.readFileSync("./example.json"));
  const { incidentCount, incidentTypes, affectedCustomers, parsedIncidents } =
    parse(json);

  const posts = [];

  if (!state.seenIncidents) {
    state.seenIncidents = parsedIncidents.map((incident) => incident.id);
  }

  const newIncidentIds = parsedIncidents.map((incident) => incident.id);
  const resolvedIncidents = (state.knownIncidents || []).filter(
    (knownIncident) => !newIncidentIds.includes(knownIncident.id)
  );
  state.knownIncidents = parsedIncidents;

  const newIncidents = parsedIncidents.filter(
    (incident) => !state.seenIncidents.includes(incident.id)
  );

  console.log(newIncidents.length, "new incidents");
  state.seenIncidents.push(...newIncidents.map((incident) => incident.id));
  const shouldPostSummary =
    newIncidents.length &&
    (!state.lastSummary || state.lastSummary < Date.now() - SUMMARY_TIME);

  if (shouldPostSummary) {
    state.lastSummary = Date.now();
  }

  if (newIncidents.length) {
    const getSinglePost = (incident) =>
      `New power outage out for ${incident.customersAffected} customers at ${incident.suburbs}: ${incident.reason}`;

    if (newIncidents.length > 1) {
      const post = [
        `${newIncidents.length} new outages:`,
        newIncidents
          .map(
            (incident) =>
              `- ${incident.customersAffected} customers at ${incident.suburbs}`
          )
          .join("\n"),
      ].join("\n");
      // if it fits in a Bluesky skeet
      if (post.length < 300) {
        posts.push(post);
      } else {
        posts.push(...newIncidents.map(getSinglePost));
      }
    } else {
      posts.push(getSinglePost(newIncidents[0]));
    }
  }

  if (resolvedIncidents.length) {
  }

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
    posts.push(summary);
  } else {
    console.log(
      "not posting summary because last post was",
      (Date.now() - state.lastSummary) / 1000 / 60,
      "minutes ago"
    );
  }

  return { posts, state };
}
