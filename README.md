# Legacy of Warden: promo site

A static promo page for the game: no build step, no framework. It is served by GitHub Pages straight from `main`.

```
index.html        the page (all text lives here)
privacy.html      Privacy Policy (the URL for the Play Console)
terms.html        Terms of Use
press.html        Press kit: fact sheet, logo, banner, in-game previews
js/contact.js     the contact email shown on every page (CONTACT_EMAIL)
css/site.css      styles (game palette: dark navy, gold, bronze)
js/site.js        skills / items / jobs browsers, gallery, links (LINKS at the top)
data/*.json       generated from the game's code (do not edit by hand)
img/skills, img/items, img/nodes, img/jobs   generated: only the art the data points at
img/shots         8 in-game screenshots (webp, from the trailer frames)
img/art           logo, key art, plane strips, icon
media/            web-size trailer clips and posters
tools/build-data.cjs   the data generator
```

## Preview locally

The page loads `data/*.json` with `fetch`, so open it through a small web server, not as a file:

```
python -m http.server 8765
```

Then open http://localhost:8765/.

## Update the skills, items and jobs

When the game's skills, gear or jobs change, run the generator against the game repo (the web version's `src/game`):

```
node tools/build-data.cjs "D:/Github Project/legacy-of-warden"
```

It rewrites `data/*.json`, copies the icons it needs into `img/` and deletes the icons that are no longer used. Then commit
and push; Pages updates in a minute or two.

## Other updates

- Contact email: `CONTACT_EMAIL` in `js/contact.js`.
- Privacy Policy: `privacy.html`. Its Play Console URL is https://fighterloo.github.io/legacy-of-warden-site/privacy.html. Keep it in step with the Data safety form.
- Store and video links: `LINKS` at the top of `js/site.js` (empty links stay hidden).
- Screenshots: replace the files in `img/shots/` (1280 x 720 webp) and the `SHOTS` list in `js/site.js`.
- Trailer clips: `media/*.mp4` (keep each under ~10 MB; 720p, H.264, `-movflags +faststart`).
- Release and DLC text: the `#release` section of `index.html`.

## Publish on GitHub Pages

1. Create a GitHub repo (for example `legacy-of-warden-site`) and push this folder to its `main` branch.
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/legacy-of-warden-site/`. A custom domain can be set on the same page.

`.nojekyll` keeps GitHub from running Jekyll on the files.
