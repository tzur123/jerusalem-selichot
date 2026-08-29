import { describe, expect, it } from "vitest";
import { computeNextStationId, isTourComplete } from "./next-station";

const stations = [
  { id: "1", orderIndex: 1 },
  { id: "2", orderIndex: 2 },
  { id: "3", orderIndex: 3 },
  { id: "4", orderIndex: 4 },
  { id: "5", orderIndex: 5 },
];

describe("computeNextStationId", () => {
  it("follows 1 -> 2 -> 3 -> 4 -> 5 in order", () => {
    expect(computeNextStationId(stations, "1", new Set())).toBe("2");
    expect(computeNextStationId(stations, "2", new Set())).toBe("3");
    expect(computeNextStationId(stations, "4", new Set())).toBe("5");
  });

  it("wraps around from the last station to the first", () => {
    expect(computeNextStationId(stations, "5", new Set())).toBe("1");
  });

  it("matches the spec example: starting at 3 goes 3 -> 4 -> 5 -> 1 -> 2", () => {
    const completed = new Set<string>();
    let current = "3";
    const order = [current];
    for (let i = 0; i < 4; i++) {
      completed.add(current);
      const next = computeNextStationId(stations, current, completed);
      expect(next).not.toBeNull();
      current = next as string;
      order.push(current);
    }
    expect(order).toEqual(["3", "4", "5", "1", "2"]);
  });

  it("skips already-completed stations", () => {
    const completed = new Set(["2", "3"]);
    expect(computeNextStationId(stations, "1", completed)).toBe("4");
  });

  it("returns null once every other station is completed", () => {
    const completed = new Set(["2", "3", "4", "5"]);
    expect(computeNextStationId(stations, "1", completed)).toBeNull();
  });

  it("returns null for an empty station list", () => {
    expect(computeNextStationId([], "1", new Set())).toBeNull();
  });
});

describe("isTourComplete", () => {
  it("is false when no stations exist", () => {
    expect(isTourComplete([], new Set())).toBe(false);
  });

  it("is false when some stations are incomplete", () => {
    expect(isTourComplete(stations, new Set(["1", "2"]))).toBe(false);
  });

  it("is true when every station is completed", () => {
    expect(isTourComplete(stations, new Set(["1", "2", "3", "4", "5"]))).toBe(true);
  });
});
