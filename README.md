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
img/shots         9 in-game previews (webp, from the Godot captures)
img/art           logo, key art, plane strips, icon
media/            hero loop video and the video posters (the videos themselves are on YouTube)
tools/build-data.cjs   the data generator
```

## Preview locally

The page loads `data/*.json` with `fetch`, so open it through a small web server, not as a file:

```
python -m http.server 8765
```

Then open http://localhost:8765/.

## Update the skills and jobs

When the game's skills, talents or jobs change, run the generator against the game repo (it reads the Godot game's
`godot/data/*.json` and the port's own words in `godot/scripts/core`, the Bloodmoon Realm pack included):

```
node tools/build-data.cjs "D:/Github Project/legacy-of-warden"
```

It rewrites `data/skills.json`, `data/jobs.json` and the counts in `data/stats.json`, and copies any icon the site lacks
from `godot/assets` (pictures it already has are kept). Texts keep the game's coloured words (`{n:…}`, `{fire:…}`,
`{note:…}`, one point a line); `js/site.js` `rich()` draws them. `items.json`, `sets.json` and `planes.json` are not
generated any more (the old web generator is gone): edit them by hand. Then commit and push; Pages updates in a minute or two.

## Other updates

- Contact email: `CONTACT_EMAIL` in `js/contact.js`.
- Privacy Policy: `privacy.html`. Its Play Console URL is https://fighterloo.github.io/legacy-of-warden-site/privacy.html. Keep it in step with the Data safety form.
- Store and video links: `LINKS` at the top of `js/site.js` (empty links stay hidden).
- In-game previews and the Google Play set: `bash tools/build-playstore.sh "<preview folder>" "<godot-port repo>"` reads the Godot
  captures in `<preview folder>/godot-capture/{landscape,portrait,landscape-pc}`, writes `<preview folder>/playstore-final/`
  (icon, feature graphic, phone, phone-captioned, tablet-7, tablet-10, pc) and refreshes `img/shots/`. Captions: `SHOTS` in `js/site.js`.
- Videos: the trailer and the careless-vs-planned combos are YouTube embeds: the `data-yt` id on each `button.yt` in `index.html`,
  with a local poster in `media/`. The player loads only on click, from youtube-nocookie.com. YouTube: trailer
  ZIGFAp2W-pY, trailer Short VYiky-fPafA, combo (Archmage) Y70X74ScpZc, combo Short (Spellblade) PRq2uYSpnFE
  (trailer v3, 31 Oct 2026; posters `media/*-v3.webp` cut from the v3 videos).
  A video hosted on the site itself (like `media/hero-loop.mp4`) must be H.264 with `-pix_fmt yuv420p`: Godot captures come
  out as 4:4:4, which most browsers refuse ("file is corrupt"). Example:
  `ffmpeg -i in.mp4 -c:v libx264 -pix_fmt yuv420p -crf 27 -preset slow -vf scale=1280:-2 -an -movflags +faststart out.mp4`.
- Planes: `data/planes.json` (numbers from progression.js, effects from quest-system.js PLANE_RULES). A board shot per plane
  goes in `img/planes/plane-1.webp` … `plane-6.webp` (1280 x 720); a missing one falls back to the plane art.
- Jobs: `data/jobs.json` carries the whole tree (`tree`, `edges`, `roads`, `caps`); node positions are `TREE_POS` in `js/site.js`.
- Platforms: `img/devices/{phone,tablet,pc}.webp` are the phone, tablet and PC captures shown in the CSS device frames.
- Release and DLC text: the `#release` section of `index.html`.

## Music

`media/audio/ambient-1.mp3` is the game's menu theme, "Ambient 1" by AlkaKrab, used on this site with the author's written
permission (email reply, 25 Oct 2026). Keep the footer credit. It is off until the visitor presses the Music button.
Do not add other AlkaKrab tracks without asking: the licence forbids redistributing the files as-is.

## Cache

After changing `css/site.css` or a script, bump the `?v=` number on its link in all four HTML pages, so visitors
get the new file instead of a cached one. `data/*.json` is fetched with `no-cache` and needs nothing.

## Publish on GitHub Pages

1. Create a GitHub repo (for example `legacy-of-warden-site`) and push this folder to its `main` branch.
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/legacy-of-warden-site/`. A custom domain can be set on the same page.

`.nojekyll` keeps GitHub from running Jekyll on the files.
