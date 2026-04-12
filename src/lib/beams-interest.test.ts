import { describe, expect, it } from "vitest";
import { beamsInterestForUserId } from "./beams-interest";

describe("beamsInterestForUserId", () => {
  it("prefija el id de usuario", () => {
    expect(beamsInterestForUserId("507f1f77bcf86cd799439011")).toBe(
      "user-507f1f77bcf86cd799439011",
    );
  });
});
