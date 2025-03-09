const OVERVIEW_TIME = 1000 * 60 * 60;

function pluralise(count, singular, plural) {
  if (count === 1) {
    return singular;
  }
  return plural;
}

function pickBestPost(options) {
  return (
    options.filter((option) => {
      if (option.some((post) => post.length > 300)) {
        return false;
      }
      return true;
    })[0] || []
  );
}

function getOverview(newJson) {
  const totalOutageCustomers = newJson.reduce(
    (count, suburb) => count + suburb.customersAffected,
    0
  );
  const totalSuburbs = newJson.map((suburb) => suburb.name);

  const shortOverview = `Currently in Southeast Queensland there are ${totalOutageCustomers.toLocaleString(
    "en-AU"
  )} customers without power`;

  const mostAffected = newJson.reduce((biggest, suburb) => {
    if (!biggest) return suburb;
    if (suburb.customersAffected > biggest.customersAffected) {
      return suburb;
    }
    return biggest;
  }, null);

  const mostAffectedText =
    newJson.length > 3
      ? ` ${
          mostAffected.name
        } is the most affected suburb having ${mostAffected.customersAffected.toLocaleString(
          "en-AU"
        )} ${pluralise(
          mostAffected.customersAffected,
          "customer",
          "customers"
        )} without power.`
      : "";

  const overviews = [
    `${shortOverview}, across ${totalSuburbs.join(", ")}. ${mostAffectedText}`,
    `${shortOverview}, across ${totalSuburbs.join(", ")}.`,
    `${shortOverview}, across ${totalSuburbs.length.toLocaleString(
      "en-AU"
    )} ${pluralise(
      totalSuburbs.length,
      "suburb",
      "suburbs"
    )}.${mostAffectedText}`,
    `${shortOverview}, across ${totalSuburbs.length.toLocaleString(
      "en-AU"
    )} ${pluralise(totalSuburbs.length, "suburb", "suburbs")}.`,
  ].map((post) => [post]);
  return overviews;
}

function getUpdate(newJson, existingState) {
  const newOutages = [];
  const newResolutions = [];

  const newSuburbs = newJson.reduce((obj, suburb) => {
    obj[suburb.name] = suburb;
    return obj;
  }, {});
  const existingSuburbs = existingState.lastData.reduce((obj, suburb) => {
    obj[suburb.name] = suburb;
    return obj;
  }, {});

  Array.from(
    new Set([...Object.keys(newSuburbs), ...Object.keys(existingSuburbs)])
  ).forEach((name) => {
    const existingSuburb = existingSuburbs[name];
    const newSuburb = newSuburbs[name];

    const existingAffected = existingSuburb?.customersAffected || 0;
    const newAffected = newSuburb?.customersAffected || 0;
    if (existingAffected > newAffected) {
      newResolutions.push({
        name,
        customersAffected: existingAffected - newAffected,
      });
    }
    if (existingAffected < newAffected) {
      newOutages.push({
        name,
        customersAffected: newAffected - existingAffected,
      });
    }
  });

  const resolvedCustomers = newResolutions.reduce(
    (count, { customersAffected }) => count + customersAffected,
    0
  );
  const newOutageCustomers = newOutages.reduce(
    (count, { customersAffected }) => count + customersAffected,
    0
  );

  const shortResolution =
    resolvedCustomers &&
    `✅ Power restored for ${resolvedCustomers.toLocaleString(
      "en-AU"
    )} ${pluralise(resolvedCustomers, "customer", "customers")}`;
  const shortOutage =
    newOutageCustomers &&
    `⚡️ New power outages for ${newOutageCustomers.toLocaleString(
      "en-AU"
    )} ${pluralise(newOutageCustomers, "customer", "customers")}`;

  const longResolution =
    resolvedCustomers &&
    `${shortResolution} in ${newResolutions
      .map((suburb) => suburb.name)
      .join(", ")}.`;
  const longOutage =
    newOutageCustomers &&
    `${shortOutage} in ${newOutages.map((suburb) => suburb.name).join(", ")}.`;

  // A bunch of post options we can try, filtering out the ones that are too long leaves us with progressively more concise info.
  const options = [
    longOutage && longResolution && [[longOutage, longResolution].join("\n\n")],
    longOutage && longResolution && [longOutage, longResolution],

    shortOutage && longResolution && [shortOutage, longResolution],
    longOutage && shortResolution && [longOutage, shortResolution],
    shortOutage &&
      shortResolution && [[shortOutage, shortResolution].join("\n\n")],
    shortOutage && shortResolution && [shortOutage, shortResolution],
    longOutage && [longOutage],
    longResolution && [longResolution],
    shortOutage && [shortOutage],
    shortResolution && [shortResolution],
  ].filter(Boolean);
  return options;
}
export function getPosts(newJson, existingState) {
  if (!existingState?.lastData) {
    return {
      posts: [],
      state: { lastCheck: Date.now(), lastData: newJson },
    };
  }

  const posts = pickBestPost(getUpdate(newJson, existingState));
  const shouldPostOverview =
    !existingState.lastOverview ||
    existingState.lastOverview < Date.now() - OVERVIEW_TIME;
  if (shouldPostOverview) {
    posts.push(...pickBestPost(getOverview(newJson)));
  }

  return {
    posts,
    state: {
      lastCheck: Date.now(),
      lastData: newJson,
      lastOverview: shouldPostOverview
        ? Date.now()
        : existingState.lastOverview,
    },
  };
}
