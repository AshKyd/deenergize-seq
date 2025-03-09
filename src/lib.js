function pluralise(count, singular, plural) {
  if (count === 1) {
    return singular;
  }
  return plural;
}
export function getPosts(newJson, existingState) {
  if (!existingState?.lastData) {
    return {
      posts: [],
      state: { lastCheck: Number(Date.now()), lastData: newJson },
    };
  }
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
    `✅ Outages resolved for ${resolvedCustomers} ${pluralise(
      resolvedCustomers,
      "customer",
      "customers"
    )}`;
  const shortOutage =
    newOutageCustomers &&
    `⚡️ New outages for ${newOutageCustomers} ${pluralise(
      newOutageCustomers,
      "customer",
      "customers"
    )}`;

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
  ]
    .filter(Boolean)
    .filter((option) => {
      if (option.some((post) => post.length > 300)) {
        return false;
      }
      return true;
    });

  return {
    posts: options[0],
    state: { lastCheck: Number(Date.now()), lastData: newJson },
  };
}
