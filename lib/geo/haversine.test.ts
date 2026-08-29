import { describe, expect, it } from "vitest";
import { haversineDistanceMeters, findNearest, estimateWalkingSeconds } from "./haversine";

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 31.7833, lng: 35.2201 };
    expect(haversineDistanceMeters(p, p)).toBeCloseTo(0, 5);
  });

  it("computes a known short distance accurately (~within 5%)", () => {
    // Two points ~111m apart along a meridian (1/1000th of a degree of latitude).
    const a = { lat: 31.78, lng: 35.22 };
    const b = { lat: 31.781, lng: 35.22 };
    const distance = haversineDistanceMeters(a, b);
    expect(distance).toBeGreaterThan(105);
    expect(distance).toBeLessThan(115);
  });
});

describe("findNearest", () => {
  const stations = [
    { id: "a", latitude: 31.78, longitude: 35.22 },
    { id: "b", latitude: 31.79, longitude: 35.23 },
    { id: "c", latitude: 31.9, longitude: 35.3 },
  ];

  it("returns null for an empty list", () => {
    expect(findNearest({ lat: 31.78, lng: 35.22 }, [])).toBeNull();
  });

  it("finds the closest item by distance", () => {
    const result = findNearest({ lat: 31.7801, lng: 35.2201 }, stations);
    expect(result?.item.id).toBe("a");
  });

  it("picks a different nearest when the point moves", () => {
    const result = findNearest({ lat: 31.899, lng: 35.299 }, stations);
    expect(result?.item.id).toBe("c");
  });
});

describe("estimateWalkingSeconds", () => {
  it("scales linearly with distance", () => {
    expect(estimateWalkingSeconds(0)).toBe(0);
    expect(estimateWalkingSeconds(130)).toBeGreaterThan(90);
  });
});
