import { describe, it, expect } from "vitest";
import { parseSegments, extractThemes, extractQuotes, generateInsights, processTranscript } from "../transcript-processor.js";

const SAMPLE_TRANSCRIPT = `
Sarah: I really love how easy the dashboard is to navigate. The search feature is great.
John: Yeah but I find the settings page really confusing. I got lost trying to change my password.
Sarah: I agree the settings could be better. But the main navigation is intuitive.
John: The loading time is frustrating too. I had to wait like ten seconds for the reports to load.
Sarah: I think the reports themselves are excellent though. Very clear data visualization.
John: True, the charts are good. But I wish I could export them. That's been a pain point for our team.
Sarah: We definitely need an export feature. I've been taking screenshots instead which is frustrating and slow.
John: Exactly. And the mobile version is basically unusable. The buttons are too small to tap accurately.
`;

const TIMESTAMPED_TRANSCRIPT = `
[00:15] Interviewer: Can you walk me through your typical workflow?
[00:22] Participant: Sure, I usually start by opening the dashboard and checking my notifications.
[01:05] Interviewer: What do you find most challenging?
[01:12] Participant: The search is really slow and I can never find what I'm looking for quickly.
`;

describe("parseSegments", () => {
  it("detects speakers from Name: pattern", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    expect(segments.length).toBeGreaterThan(0);
    const speakers = [...new Set(segments.map((s) => s.speaker))];
    expect(speakers).toContain("Sarah");
    expect(speakers).toContain("John");
  });

  it("detects timestamped speakers", () => {
    const segments = parseSegments(TIMESTAMPED_TRANSCRIPT);
    expect(segments.length).toBeGreaterThan(0);
    const speakers = [...new Set(segments.map((s) => s.speaker))];
    expect(speakers).toContain("Interviewer");
    expect(speakers).toContain("Participant");
    expect(segments[0].timestamp).toBe("00:15");
  });

  it("detects Q/A format", () => {
    const segments = parseSegments("Q: What do you think?\nA: I think it's great.");
    expect(segments).toHaveLength(2);
    expect(segments[0].speaker).toBe("Q");
    expect(segments[1].speaker).toBe("A");
  });

  it("assigns sentiment to segments", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const sentiments = segments.map((s) => s.sentiment);
    expect(sentiments).toContain("positive");
    expect(sentiments).toContain("negative");
  });

  it("handles continuation lines", () => {
    const text = "Sarah: This is a long thought\nthat continues on the next line.\nJohn: And then I respond.";
    const segments = parseSegments(text);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toContain("continues on the next line");
  });
});

describe("extractThemes", () => {
  it("extracts themes from segments", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const themes = extractThemes(segments);
    expect(themes.length).toBeGreaterThan(0);
    // "frustrating" or "confusing" or "slow" should appear as themes
    const themeNames = themes.map((t) => t.name);
    expect(themeNames.some((n) => /frustrat|confus|slow|export|mobile|dashboard|search/.test(n))).toBe(true);
  });

  it("respects minFrequency threshold", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const themes = extractThemes(segments, 3);
    for (const theme of themes) {
      expect(theme.frequency).toBeGreaterThanOrEqual(3);
    }
  });

  it("includes quotes for each theme", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const themes = extractThemes(segments);
    for (const theme of themes) {
      expect(theme.quotes.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("extractQuotes", () => {
  it("extracts first-person quotes with attribution", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const quotes = extractQuotes(segments, 8);
    expect(quotes.length).toBeGreaterThan(0);
    for (const q of quotes) {
      expect(q).toMatch(/" - /); // has attribution
    }
  });
});

describe("generateInsights", () => {
  it("generates insights from themes", () => {
    const segments = parseSegments(SAMPLE_TRANSCRIPT);
    const themes = extractThemes(segments);
    const insights = generateInsights(themes, segments, "test-interview");
    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      expect(insight.source).toBe("test-interview");
      expect(insight.tags).toContain("interview");
      expect(insight.evidence.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("processTranscript", () => {
  it("produces complete result", () => {
    const result = processTranscript(SAMPLE_TRANSCRIPT, "user-interviews");
    expect(result.speakers.length).toBeGreaterThan(0);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.summary).toContain("speaker");
    expect(result.summary).toContain("segments");
  });

  it("handles empty transcript", () => {
    const result = processTranscript("");
    expect(result.segments).toHaveLength(0);
    expect(result.speakers).toHaveLength(0);
  });

  it("handles single-speaker transcript", () => {
    const result = processTranscript("Narrator: The system was difficult to use. The buttons were confusing. Navigation was confusing.");
    expect(result.speakers).toHaveLength(1);
    expect(result.speakers[0]).toBe("Narrator");
  });
});
