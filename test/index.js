/* global describe, it */
import assert from "assert";
import { getPosts } from "../src/lib.js";

describe("parse", () => {
  it("single post", () => {
    const newJson = {
      features: [
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "RUSSELL ISLAND",
          },
        },
      ],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: 0,
    });
    assert.deepEqual(res.posts, [
      "New power outage out for 263 customers at RUSSELL ISLAND: Under Investigation",
      "1 incident, 263 customers without power. Causes: TBD: 1.",
    ]);

    const secondRes = getPosts({ features: [] }, res.state);
    assert.deepEqual(secondRes.posts, []);
  });
  it("multiple posts", () => {
    const newJson = {
      features: [
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "RUSSELL ISLAND",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829171-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "104",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "BONOGIN",
          },
        },
      ],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: Date.now(),
    });
    assert.deepEqual(res.posts, [
      "2 new outages:\n- 263 customers at RUSSELL ISLAND\n- 104 customers at BONOGIN",
    ]);
  });
  it("multiple posts when too big for BS", () => {
    const newJson = {
      features: [
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "BILINGA, BROADBEACH, COOLANGATTA, TUGUN",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829171-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "104",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "ADVANCETOWN, MUDGEERABA, TALLAI",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "BILINGA, BROADBEACH, COOLANGATTA, TUGUN",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829171-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "104",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "ADVANCETOWN, MUDGEERABA, TALLAI",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "BILINGA, BROADBEACH, COOLANGATTA, TUGUN",
          },
        },
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829171-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "104",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "ADVANCETOWN, MUDGEERABA, TALLAI",
          },
        },
      ],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: Date.now(),
    });
    assert.deepEqual(res.posts, [
      "New power outage out for 263 customers at BILINGA, BROADBEACH, COOLANGATTA, TUGUN: Under Investigation",
      "New power outage out for 104 customers at ADVANCETOWN, MUDGEERABA, TALLAI: Under Investigation",
      "New power outage out for 263 customers at BILINGA, BROADBEACH, COOLANGATTA, TUGUN: Under Investigation",
      "New power outage out for 104 customers at ADVANCETOWN, MUDGEERABA, TALLAI: Under Investigation",
      "New power outage out for 263 customers at BILINGA, BROADBEACH, COOLANGATTA, TUGUN: Under Investigation",
      "New power outage out for 104 customers at ADVANCETOWN, MUDGEERABA, TALLAI: Under Investigation",
    ]);
  });
});
