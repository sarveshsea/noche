---
name: usability-testing
description: Usability testing frameworks -- test planning, task scenarios, moderated and unmoderated protocols, analysis frameworks, and insight synthesis for Memoire research pipeline
category: research
activateOn: research-to-dashboard
freedomLevel: high
tags: [usability, testing, ux-research, task-analysis, think-aloud, insights]
version: 1.0.0
---

# Usability Testing -- Research Skill Pack

Structured methodology for planning, executing, and analyzing usability tests. Integrates with the Memoire research pipeline to transform raw observations into actionable design decisions.

---

## Test Planning Methodology

### 1. Define Research Questions

Every test starts with 3-5 focused research questions. Format:

```
RQ1: Can users complete [task] without assistance?
RQ2: Where do users hesitate or make errors during [flow]?
RQ3: How does [new pattern] compare to [existing pattern] in efficiency?
```

### 2. Choose Test Type

| Method | Best For | Participants | Duration |
|--------|----------|-------------|----------|
| Moderated in-person | Complex flows, emotional reactions | 5-8 | 45-60 min |
| Moderated remote | Geographic diversity, screen sharing | 5-8 | 30-45 min |
| Unmoderated remote | High volume, simple tasks | 15-30 | 10-20 min |
| Guerrilla | Quick validation, low-fidelity prototypes | 5-10 | 5-15 min |
| A/B comparison | Comparing two design variants | 10-20 per variant | 15-30 min |

### 3. Determine Fidelity

| Fidelity | Tool | When to Use |
|----------|------|------------|
| Paper / wireframe | Sketches, Balsamiq | Early concept validation |
| Mid-fidelity | Figma prototype (no animation) | Flow and IA validation |
| High-fidelity | Figma prototype (full interactions) | Visual design and micro-interaction testing |
| Production | Staged deployment | Pre-launch validation |

---

## Task Scenario Design

### Anatomy of a Good Task

```
Context:  You are shopping for a birthday gift for a friend.
Trigger:  You want to find a book under $30 and add it to your cart.
Goal:     Complete the purchase using the saved payment method.
```

### Rules

1. Write scenarios, not instructions. Say "Find a book under $30" not "Click the search bar, type books, click filter."
2. Avoid leading language. Do not mention UI elements by name.
3. Include realistic context. Why is the user doing this?
4. Define clear completion criteria. What state means success?
5. Order tasks from simple to complex. Build confidence before testing harder flows.

### Task Template

| Field | Content |
|-------|---------|
| Task ID | T-001 |
| Scenario | [Context + trigger + goal] |
| Success Criteria | [Observable outcome] |
| Max Time | [Minutes before intervention] |
| Priority | [Critical / Important / Nice-to-have] |
| Related RQ | [RQ1, RQ2, etc.] |

---

## Moderated Testing Protocol

### Before the Session

1. Pilot test with 1 internal participant -- fix unclear tasks
2. Prepare consent form (recording, data usage)
3. Set up recording (screen + audio minimum; camera optional)
4. Prepare facilitator guide with exact script

### Facilitator Guide Structure

```
1. Welcome and consent          (2 min)
2. Background questions         (3 min)
3. Task scenarios               (25-35 min)
4. Post-task questionnaire      (5 min)
5. Debrief and open questions   (5 min)
```

### Facilitation Rules

- Use the think-aloud protocol: "Tell me what you are thinking as you go."
- Never answer questions about the interface. Redirect: "What would you expect to happen?"
- Note moments of confusion, hesitation, backtracking, and verbal frustration.
- Record timestamps for each task start and task completion.
- If participant is stuck for more than 2 minutes, offer a hint. After 3 minutes, assist and note the failure.

---

## Unmoderated Testing Protocol

### Platform Setup

Configure in tools such as UserTesting, Maze, or Lookback:

1. Welcome screen with consent and instructions
2. Screener questions to validate participant fit
3. Task sequence with success URLs or click targets
4. Post-task single ease question (SEQ) after each task
5. Final SUS questionnaire
6. Thank-you screen with compensation details

### Task Validation

- Define success paths (correct click sequence)
- Define failure indicators (wrong page, timeout, abandon)
- Set maximum task duration
- Include at least one baseline task that should be trivially easy

---

## Metrics

### Core Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Task Success Rate | (Successful completions / Total attempts) * 100 | > 80% |
| Time on Task | Median seconds from task start to completion | Context-dependent |
| Error Rate | Errors per task per participant | < 1.0 |
| Lostness | (N/S - 1) + (R/N - 1) where N=pages visited, S=minimum path, R=revisits | < 0.4 |
| Task-Level Satisfaction | Single Ease Question (SEQ), 1-7 scale | > 5.0 |

### Standardized Questionnaires

| Instrument | Measures | Scale | Benchmark |
|------------|----------|-------|-----------|
| SUS (System Usability Scale) | Overall usability | 0-100 | > 68 is above average |
| SEQ (Single Ease Question) | Per-task difficulty | 1-7 | > 5.0 is acceptable |
| UMUX-Lite | Usability + usefulness | 0-100 | > 65 is acceptable |
| NASA-TLX | Cognitive workload | 0-100 (lower is better) | Context-dependent |

### SUS Calculation

```
1. For odd-numbered questions (1,3,5,7,9): score - 1
2. For even-numbered questions (2,4,6,8,10): 5 - score
3. Sum all adjusted scores
4. Multiply by 2.5
5. Result is 0-100
```

---

## Recruitment and Sampling

### Sample Size Guidelines

| Goal | Participants | Rationale |
|------|-------------|-----------|
| Find major usability issues | 5 | Discovers ~85% of problems (Nielsen/Landauer) |
| Quantitative confidence | 20+ | Statistical significance for task metrics |
| A/B comparison | 15-20 per variant | Enough for between-subjects comparison |
| Accessibility audit | 3-5 per disability type | Specialized needs require targeted recruitment |

### Screener Design

1. Demographics (age, location, occupation)
2. Technology proficiency (devices, frequency)
3. Domain experience (relevant product/service usage)
4. Disqualifiers (employees, competitors, recent participants)
5. Availability and compensation agreement

### Recruitment Sources

- User database / CRM (existing users)
- Panel services (UserTesting, Respondent, Prolific)
- Social media and community channels
- Intercept / pop-up on live product
- Internal team members (pilot only, never for real data)

---

## Analysis Frameworks

### Rainbow Spreadsheet

| Participant | Task | Observation | Severity | Theme |
|-------------|------|-------------|----------|-------|
| P1 | T-001 | Could not find filter button | High | Discoverability |
| P2 | T-001 | Found filter but expected different behavior | Medium | Mental model mismatch |
| P3 | T-002 | Completed easily | -- | -- |

Color-code rows by participant. Cluster observations by theme. Count frequency across participants.

### Severity Rating

| Level | Label | Definition |
|-------|-------|-----------|
| 1 | Cosmetic | Noticed but no impact on task completion |
| 2 | Minor | Slows users down but they recover |
| 3 | Major | Causes errors or significant confusion; some fail |
| 4 | Critical | Blocks task completion for most users |

### Affinity Mapping

1. Write each observation on a virtual sticky (Figma, FigJam, or Miro)
2. Group stickies by similarity without pre-defined categories
3. Name each group with a theme label
4. Rank themes by frequency and severity
5. Map themes to design recommendations

---

## Report Template

```markdown
# Usability Test Report: [Feature/Product Name]

## Executive Summary
- [2-3 sentence overview of findings]
- [Key metric: e.g., "Task success rate was 65%, below the 80% target"]

## Methodology
- Participants: [N], recruited via [source]
- Method: [Moderated remote / Unmoderated / etc.]
- Date: [Range]
- Tasks: [Count]

## Key Findings

### Finding 1: [Theme Name]
- Severity: [Critical / Major / Minor / Cosmetic]
- Frequency: [X of Y participants]
- Evidence: [Quote or observation]
- Recommendation: [Specific design change]

### Finding 2: ...

## Metrics Summary
| Task | Success Rate | Median Time | Error Rate | SEQ |
|------|-------------|-------------|------------|-----|
| T-001 | 80% | 45s | 0.4 | 5.2 |
| T-002 | 60% | 120s | 1.8 | 3.1 |

## SUS Score: [XX] ([Adjective rating])

## Recommendations (Prioritized)
1. [Critical fix] -- Expected impact: [metric improvement]
2. [Major improvement] -- Expected impact: [metric improvement]
3. [Minor enhancement] -- Expected impact: [metric improvement]

## Appendix
- Task scenarios
- Screener questionnaire
- Raw data tables
```

---

## Integration with Memoire Research Pipeline

### Data Flow

```
Usability test data (Excel/CSV/Stickies)
  --> memi research from-file <data>
  --> memi research synthesize
  --> memi research report
  --> Dashboard / Figma stickies
```

### Supported Input Formats

| Format | Command | Notes |
|--------|---------|-------|
| Excel spreadsheet | `memi research from-file results.xlsx` | Rainbow spreadsheet format |
| CSV export | `memi research from-file results.csv` | From Maze, UserTesting |
| Figma stickies | `memi research from-stickies` | Affinity map in FigJam |
| Manual notes | `memi research from-file notes.md` | Markdown observation log |

### Synthesis Pipeline

1. **Import**: Parse raw data into structured observations
2. **Classify**: Tag each observation by severity, task, and theme
3. **Cluster**: Group observations into findings using affinity analysis
4. **Quantify**: Calculate metrics (success rate, error rate, SUS)
5. **Prioritize**: Rank findings by severity * frequency
6. **Report**: Generate markdown report and dashboard components

---

## Remote Testing Tools and Setup

### Tool Comparison

| Tool | Moderated | Unmoderated | Prototype Testing | Analytics | Price Tier |
|------|-----------|-------------|-------------------|-----------|------------|
| UserTesting | Yes | Yes | Yes | Advanced | Enterprise |
| Maze | No | Yes | Yes (Figma) | Good | Mid |
| Lookback | Yes | Yes | Limited | Basic | Mid |
| Hotjar | No | Surveys only | No | Heatmaps | Low |
| Lyssna (UsabilityHub) | No | Yes | First-click, preference | Basic | Low |

### Remote Session Checklist

- [ ] Confirm participant has stable internet and a quiet environment
- [ ] Test screen-sharing and recording before the session
- [ ] Share prototype link (not the Figma editor link)
- [ ] Disable notifications on facilitator and participant machines
- [ ] Have a backup communication channel (phone number)
- [ ] Record both screen and audio; get consent before starting
- [ ] Prepare a post-session backup plan if technology fails
