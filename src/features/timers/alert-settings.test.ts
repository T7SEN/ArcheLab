import { describe, expect, it } from "vitest";
import { defaultAlert, parseAlertSettings } from "./alert-settings";

describe("parseAlertSettings", () => {
  it("reads what was saved", () => {
    expect(
      parseAlertSettings(JSON.stringify({ on: true, minutes: 10 })),
    ).toEqual({ on: true, minutes: 10 });
  });

  it("treats nothing, broken text and lead times not offered as the default", () => {
    expect(parseAlertSettings(null)).toEqual(defaultAlert);
    expect(parseAlertSettings("{not json")).toEqual(defaultAlert);
    expect(parseAlertSettings("null")).toEqual(defaultAlert);
    expect(
      parseAlertSettings(JSON.stringify({ on: "yes", minutes: 7 })),
    ).toEqual({ on: false, minutes: defaultAlert.minutes });
  });
});
