# Test Coverage Analysis

## Current State

**Test coverage: 0%** — This project has no tests, no testing framework, no test configuration, and no CI pipeline running tests.

| File | Lines | Coverage |
|------|-------|----------|
| `script.js` | 769 | 0% |
| `flow-gradient.js` | 252 | 0% |
| `glare-cards.js` | 62 | 0% |
| `styles.css` | 2,174 | 0% |
| `index.html` | 76,511 | 0% |

---

## Recommended Testing Strategy

### 1. Set Up Testing Infrastructure

**Unit tests:** Install [Vitest](https://vitest.dev/) + [jsdom](https://github.com/jsdom/jsdom) for fast, lightweight unit testing of JavaScript modules.

**E2E tests:** Install [Playwright](https://playwright.dev/) for cross-browser end-to-end testing of interactive features.

**CI:** Add a GitHub Actions workflow that runs tests before Vercel deploys.

### 2. Refactor for Testability

The current code executes side effects at the top level (e.g., `script.js` immediately queries the DOM and attaches listeners on load). To make it testable:

- Extract pure logic into exported functions (carousel index calculation, counter animation math, scroll percentage computation).
- Wrap DOM-dependent initialization in functions that accept element references as parameters instead of querying the DOM directly.

---

## Priority Areas for Testing

### P0 — High Impact, Easy to Test (Unit Tests)

These contain extractable pure logic that can be tested without a browser:

| Function/Logic | File | What to Test |
|----------------|------|-------------|
| `animateCounter()` | `script.js:243` | Verify counter reaches target value; verify intermediate values are floored |
| Carousel active index calculation | `script.js:83` | `Math.round(scrollLeft / cardWidth)` — test edge cases (0, mid-scroll, end) |
| Scroll percentage calculation | `script.js:155-161` | Verify thumb position maps correctly to scroll position |
| `TouchTexture.addTouch()` | `flow-gradient.js:40` | Force/velocity calculation, trail point creation, deduplication of same-position touches |
| `TouchTexture.drawPoint()` | `flow-gradient.js:54` | Intensity curve (ramp up in first 30% of age, decay after) |
| `FlowGradient.getViewSize()` | `flow-gradient.js:122` | FOV-to-size math, NaN/zero fallback |
| Glare card rotation math | `glare-cards.js:14-36` | Verify `rotateX`, `rotateY`, `bgX`, `bgY` for known pointer positions (center, corners, edges) |

### P1 — Core User Interactions (E2E Tests)

These are the critical user-facing flows that should be tested in a real browser:

| Feature | File | What to Test |
|---------|------|-------------|
| Mobile nav toggle | `script.js:39-71` | Open/close menu, overlay click closes, link click closes, body overflow locked when open |
| Discord popup | `script.js:109-144` | Toggle on click, close on outside click, copy-to-clipboard updates button text |
| Video modal | `script.js:538-579` | Open, close via button/overlay/Escape, videos pause on close |
| Calendly modal | `script.js:611-646` | Open, close via button/overlay/Escape |
| Timeline toggle | `script.js:581-609` | Expand shows hidden items, collapse hides them, text toggles between "Show Full Timeline" / "Hide Timeline" |
| Carousel dot navigation | `script.js:74-107` | Clicking a dot scrolls to the correct card, scrolling updates the active dot |
| Smooth scroll nav links | `script.js:229-240` | Clicking `#anchor` links scrolls to the target section |

### P2 — Visual & Animation Tests (E2E / Visual Regression)

| Feature | File | What to Test |
|---------|------|-------------|
| Navbar background opacity | `script.js:219-226` | Background changes after scrolling past 100px |
| Tubelight nav active state | `script.js:688-724` | Active state updates based on scroll position and click |
| Scroll indicator hide | `script.js:468-484` | Indicator fades after scrolling past 5px |
| GSAP section reveals | `script.js:281-295` | Elements become visible when scrolled into viewport |
| Three.js gradient renders | `flow-gradient.js` | Canvas element is created, no WebGL errors thrown |
| Responsive layout | `styles.css` | Key breakpoints (768px, 480px) don't cause horizontal overflow |

### P3 — Accessibility & Edge Cases

| Area | What to Test |
|------|-------------|
| Keyboard navigation | Tab order through nav links, Escape closes modals, Enter activates buttons |
| Screen reader | Semantic landmarks exist (`nav`, `main`, `section`), images have alt text, modals trap focus |
| Touch interactions | Scroll thumb drag works on touch devices, carousels swipe correctly |
| No-JS fallback | Content is still readable if JavaScript fails to load |
| Performance | Three.js gradient doesn't drop below 30fps on mobile, no memory leaks from animation loops |

---

## Suggested First Steps

1. **Add `package.json`** with Vitest as a dev dependency
2. **Extract pure functions** from `script.js` into a `utils.js` module (counter math, scroll calculations, carousel index)
3. **Write 5-10 unit tests** for the extracted functions (P0 list above)
4. **Add one Playwright E2E test** covering the mobile nav toggle flow (P1)
5. **Add a GitHub Actions workflow** that runs `vitest` on push

This gives you a testing foundation with minimal effort, covering the logic most likely to break during future changes.
