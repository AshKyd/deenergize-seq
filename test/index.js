/* global describe, it */
import assert from "assert";
import { getPosts } from "../src/lib.js";

const RUSSEL_ISLAND = {
  type: "Feature",
  geometries: [],
  properties: {
    EVENT_ID: "INCD-829170-g",
    TYPE: "UNPLANNED",
    CUSTOMERS_AFFECTED: "263",
    REASON: "Under Investigation",
    STATUS: "Awaiting",
    SUBURBS: "RUSSELL ISLAND",
    START: "11:29PM 05 Mar 2020",
  },
};

const BONOGIN = {
  type: "Feature",
  geometries: [],
  properties: {
    EVENT_ID: "INCD-829171-g",
    TYPE: "UNPLANNED",
    CUSTOMERS_AFFECTED: "104",
    REASON: "Under Investigation",
    STATUS: "Awaiting",
    SUBURBS: "BONOGIN",
    START: "11:29PM 05 Mar 2020",
  },
};

describe("parse", () => {
  it("single post", () => {
    const newJson = {
      features: [RUSSEL_ISLAND],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: 0,
    });
    assert.deepEqual(res.posts, [
      "New power outage out for 263 customers at RUSSELL ISLAND: Under Investigation",
      "Currently in Southeast Queensland there is 1 incident and 263 customers without power. Causes: TBD: 1.",
    ]);

    const secondRes = getPosts({ features: [] }, res.state);
    assert.deepEqual(secondRes.posts.length, 1);
    assert.match(
      secondRes.posts[0],
      /Power restored for 263 customers after \d+ hours at RUSSELL ISLAND/
    );
  });
  it("multiple posts", () => {
    const newJson = {
      features: [RUSSEL_ISLAND, BONOGIN],
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
        RUSSEL_ISLAND,
        BONOGIN,
        RUSSEL_ISLAND,
        BONOGIN,
        {
          type: "Feature",
          geometries: [],
          properties: {
            EVENT_ID: "INCD-829170-g",
            TYPE: "UNPLANNED",
            CUSTOMERS_AFFECTED: "263",
            REASON: "Under Investigation",
            STATUS: "Awaiting",
            SUBURBS: "RUSSELL ISLAND, ".repeat(20),
            START: "11:29PM 05 Mar 2020",
          },
        },
      ],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: Date.now(),
    });
    assert.deepEqual(res.posts, [
      "New power outage out for 263 customers at RUSSELL ISLAND: Under Investigation",
      "New power outage out for 104 customers at BONOGIN: Under Investigation",
      "New power outage out for 263 customers at RUSSELL ISLAND: Under Investigation",
      "New power outage out for 104 customers at BONOGIN: Under Investigation",
      "New power outage out for 263 customers at RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, RUSSELL ISLAND, : Under Investigation",
    ]);
  });
  it(">5 posts, small enough to fit in one message", () => {
    const newJson = {
      features: [
        RUSSEL_ISLAND,
        BONOGIN,
        RUSSEL_ISLAND,
        BONOGIN,
        RUSSEL_ISLAND,
        BONOGIN,
        RUSSEL_ISLAND,
        BONOGIN,
        RUSSEL_ISLAND,
        BONOGIN,
      ],
    };
    const res = getPosts(newJson, {
      seenIncidents: [],
      lastSummary: Date.now(),
    });
    assert.deepEqual(res.posts, [
      "There were 10 new outages affecting 1835 customers since the last check. Affected suburbs include: RUSSELL ISLAND, BONOGIN.",
    ]);
  });
});
