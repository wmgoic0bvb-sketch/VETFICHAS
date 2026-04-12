import { describe, expect, it } from "vitest";
import { playNotificationSound } from "./play-notification-sound";

describe("playNotificationSound", () => {
  it("no lanza si falta AudioContext", () => {
    expect(() => playNotificationSound()).not.toThrow();
  });
});
