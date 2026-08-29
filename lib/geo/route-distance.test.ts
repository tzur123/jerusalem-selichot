import { describe, expect, it } from "vitest";
import {
  distanceToPolylineMeters,
  evaluateReroute,
  createInitialRerouteState,
  REROUTE_CONFIG,
} from "./route-distance";

describe("distanceToPolylineMeters", () => {
  const polyline = [
    { lat: 31.78, lng: 35.22 },
    { lat: 31.781, lng: 35.22 },
    { lat: 31.782, lng: 35.221 },
  ];

  it("is ~0 for a point on the polyline", () => {
    expect(distanceToPolylineMeters({ lat: 31.7805, lng: 35.22 }, polyline)).toBeLessThan(2);
  });

  it("is large for a point far away", () => {
    expect(distanceToPolylineMeters({ lat: 31.9, lng: 35.4 }, polyline)).toBeGreaterThan(1000);
  });

  it("returns Infinity for an empty polyline", () => {
    expect(distanceToPolylineMeters({ lat: 31.78, lng: 35.22 }, [])).toBe(Infinity);
  });
});

describe("evaluateReroute", () => {
  it("does not reroute while on-route", () => {
    const { shouldReroute } = evaluateReroute({
      state: createInitialRerouteState(),
      distanceToPolylineMeters: 5,
      distanceToDestinationMeters: 500,
      nowMs: 0,
    });
    expect(shouldReroute).toBe(false);
  });

  it("requires multiple consecutive off-route samples before triggering", () => {
    let state = createInitialRerouteState();
    let shouldReroute = false;

    for (let i = 0; i < REROUTE_CONFIG.offRouteSampleCount - 1; i++) {
      const result = evaluateReroute({
        state,
        distanceToPolylineMeters: 100,
        distanceToDestinationMeters: 500,
        nowMs: i * 1000,
      });
      state = result.nextState;
      shouldReroute = result.shouldReroute;
    }
    expect(shouldReroute).toBe(false);

    const final = evaluateReroute({
      state,
      distanceToPolylineMeters: 100,
      distanceToDestinationMeters: 500,
      nowMs: REROUTE_CONFIG.offRouteSampleCount * 1000,
    });
    expect(final.shouldReroute).toBe(true);
  });

  it("does not reroute again within the cooldown window", () => {
    let state = createInitialRerouteState();
    for (let i = 0; i < REROUTE_CONFIG.offRouteSampleCount; i++) {
      const result = evaluateReroute({
        state,
        distanceToPolylineMeters: 100,
        distanceToDestinationMeters: 500,
        nowMs: i * 100,
      });
      state = result.nextState;
    }
    expect(state.lastRerouteAtMs).not.toBeNull();

    const tooSoon = evaluateReroute({
      state,
      distanceToPolylineMeters: 100,
      distanceToDestinationMeters: 500,
      nowMs: (state.lastRerouteAtMs ?? 0) + 1000,
    });
    expect(tooSoon.shouldReroute).toBe(false);
  });

  it("suppresses rerouting near the destination", () => {
    const { shouldReroute } = evaluateReroute({
      state: createInitialRerouteState(),
      distanceToPolylineMeters: 999,
      distanceToDestinationMeters: 10,
      nowMs: 0,
    });
    expect(shouldReroute).toBe(false);
  });
});
