# OpenedCog

**Free, open puzzle practice in the format of the CogAT® Level 8 (grade 2).**

OpenedCog is a static website that gives children practice with all nine subtests of the Cognitive Abilities Test, Level 8. It covers the Verbal, Quantitative, and Nonverbal batteries. The puzzles are read aloud, and there are learning and pretend-test-day modes plus a dashboard for grown-ups. There are no accounts and no tracking, and nothing leaves the device.

> OpenedCog is an independent resource. It is not affiliated with or endorsed by Riverside Insights, the publisher of the Cognitive Abilities Test. CogAT® is a registered trademark of Riverside Assessments, LLC. Every puzzle here is original and written to match the published format. None are real test items.

**Status:** early development. The public site will live at `https://remikalir.github.io/openedcog/`.

## What practice can and can't do

- The goal is **familiarity with the format**: how the puzzles look, how the directions sound, and how to move through a test. That way a child's score reflects their reasoning, not surprise or nerves.
- Practice scores **do not predict** a child's percentile, score, or placement.
- Keep sessions short and stop while it's still fun. This is practice for a young child, not a drill.

## Guiding principles

1. **Honesty.** We are clear about what practice can and can't do, and about the limits of the platform itself.
2. **Access and accessibility.** It's free with no account, and we aim for WCAG 2.2 AA in everything around the puzzles.
3. **Ease of use.** Nothing to install or sign up for. It works on phones, tablets, Chromebooks, and laptops.
4. **Privacy.** No data is collected. Progress stays on the family's device.
5. **Openness.** The code and content are public so anyone can check, adapt, or translate them.
6. **The child's experience comes first.**

## Privacy, precisely

- The site has **no accounts, analytics, cookies, ads, or third-party scripts or fonts**. Every file it loads comes from this site.
- A child's progress is saved in the browser's `localStorage`, under the key `openedcog:v1`, **on that device only**. The site never sends it anywhere.
- Grown-ups can save a **backup file** (JSON) and load it on another device. The file contains the children's names (or nicknames) and their practice results, so it should be kept private.
- **What we don't control:**
  - GitHub Pages, which hosts the site, logs visitors' IP addresses for security purposes ([GitHub docs](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).
  - Read-aloud uses the browser's built-in speech voices. Some browsers use cloud voices, which send the spoken puzzle text to the browser maker. That text never includes anything about the child.
- **Storage limits:**
  - Clearing browsing data erases progress.
  - Private windows don't keep it.
  - Safari on iPhone and iPad erases a site's data after 7 days of using Safari without visiting that site. Adding the site to the Home Screen avoids this.
  - The Grown-ups page explains all of this and offers the backup file.

## Run it locally

No build step is needed. From this folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## How it's organized

```
index.html        page shell, shared SVG patterns, footer with the non-affiliation statement
css/app.css       all styles, including the self-hosted Andika font
js/puzzles.js     the puzzle engine: verbal item banks and generators for the six number and shape subtests
js/app.js         screens, read-aloud, scoring, the Grown-ups dashboard, storage, backup files
fonts/            Andika (SIL International), with its license in fonts/OFL.txt
```

The six quantitative and nonverbal subtests generate fresh puzzles every time, so practice never runs out. Each set moves from easier to harder. The three verbal subtests draw from fixed, hand-written banks in `js/puzzles.js` (the `PA`, `SC`, and `PC` arrays), and contributions to those banks are especially welcome.

## Publish with GitHub Pages

In the repository on GitHub, go to **Settings → Pages**. Under "Build and deployment," choose **Deploy from a branch**, then select `main` and `/ (root)`. The empty `.nojekyll` file tells Pages to serve the files as they are.

## Credits and licenses

- Created by Remi Kalir.
- The Andika typeface is © SIL International and licensed under the SIL Open Font License 1.1 (see `fonts/OFL.txt`).
- Licenses for OpenedCog's code and content are still to be decided.
