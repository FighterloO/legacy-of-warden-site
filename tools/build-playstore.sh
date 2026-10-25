#!/usr/bin/env bash
# Builds the Google Play asset set from the Godot captures, and refreshes the site's in-game previews.
# Usage: bash tools/build-playstore.sh "<preview folder>" "<godot-port repo>" [--videos]
#   preview folder: holds godot-capture/{landscape,portrait,landscape-pc}; output goes to playstore-final/ next to it.
#   --videos: also re-encodes the site videos from playstore-final/video/ (heavy: only when no Godot capture is running).
# Needs ffmpeg. Run it again whenever the captures change.
set -euo pipefail
PREVIEW="${1:-D:/Github Project/legacy of warden preview}"
GODOT="${2:-D:/Github Project/legacy-of-warden/.claude/worktrees/elegant-herschel-1830a6/godot-port}"
SITE="$(cd "$(dirname "$0")/.." && pwd)"
CAP="$PREVIEW/godot-capture"
OUT="$PREVIEW/playstore-final"
FONT_B="C\\:/Windows/Fonts/georgiab.ttf"
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }

# Store order: the strongest shots first (Play shows the first three before a tap).
ORDER=(4-fight 5-art 1-board 6-realm 3-ritual 8-duel 7-map 2-moonhaven)
declare -A CAPTION=(
  [1-board]="Explore the Planes" [2-moonhaven]="Moonhaven, the Last Lantern" [3-ritual]="Build Your Ritual"
  [4-fight]="Chain the Combo" [5-art]="Unleash Forbidden Arts" [6-realm]="Roam the Endless Realm"
  [7-map]="One Island, Thirty Bosses" [8-duel]="Duel Rival Wardens"
)

# Only the folders this script makes are cleared: playstore-final/video/ (the coordinator's promo videos) stays.
for d in phone phone-captioned tablet-7 tablet-10 pc; do rm -rf "${OUT:?}/$d"; done
mkdir -p "$OUT"/{phone,phone-captioned,tablet-7,tablet-10,pc}

# 1. App icon: 512 x 512, 32-bit PNG, fully opaque (Play masks the corners itself).
ff -i "$GODOT/godot/assets/app/icon.png" -vf "scale=512:512,format=rgba,colorchannelmixer=aa=1" -frames:v 1 "$OUT/icon-512.png"

# 2. Feature graphic: 1024 x 500, Moonhaven key art + logo kept in the middle (nothing important near the edges).
ff -i "$GODOT/godot/assets/menu/warden-menu-bg.webp" -i "$GODOT/godot/assets/menu/title-logo.webp" -filter_complex \
  "[0]scale=1024:-1,crop=1024:500:0:(ih-500)/2-20,eq=brightness=-0.10:saturation=1.05,vignette=PI/3.6[bg];[1]scale=560:-1[logo];[bg][logo]overlay=(W-w)/2:(H-h)/2-6" \
  -frames:v 1 "$OUT/feature-1024x500.png"

# 2b. Feature graphic without the title (Google Play Games on PC lays its own logo over it).
ff -i "$GODOT/godot/assets/menu/warden-menu-bg.webp" -vf \
  "scale=1024:-1,crop=1024:500:0:(ih-500)/2-20,eq=brightness=-0.06:saturation=1.05,vignette=PI/4.2" \
  -frames:v 1 "$OUT/feature-1024x500-notitle.png"

# 2b2. Play Games (PC) cover: 16:9, no text at all; the 600x400 logo is laid over its centre. The key art is 1672 x 941,
#      so 1920 x 1080 is the honest size (a 4K copy would only be a blurry upscale).
ff -i "$GODOT/godot/assets/menu/warden-menu-bg.webp" -vf \
  "scale=1920:1080:flags=lanczos,eq=brightness=-0.05:saturation=1.05,vignette=PI/4.5,unsharp=5:5:0.4" \
  -frames:v 1 "$OUT/pc-cover-1920x1080.png"

# 2c. Play Games (PC) game-card logo: transparent 600 x 400, the title logo with padding and a soft dark glow
#     so it reads on dark and bright art.
ff -f lavfi -i "color=c=black@0:s=600x400,format=rgba" -i "$GODOT/godot/assets/menu/title-logo.webp" -filter_complex \
  "[1]format=rgba,scale=540:-1[logo];[logo]split[l1][l2];[l2]geq=r=0:g=0:b=0:a='if(gt(alpha(X,Y),200),150,0)',boxblur=8:2[glow];[0][glow]overlay=(W-w)/2:(H-h)/2+5[g];[g][l1]overlay=(W-w)/2:(H-h)/2,format=rgba" \
  -frames:v 1 "$OUT/pc-logo-600x400.png"

n=0
for name in "${ORDER[@]}"; do
  n=$((n + 1)); num=$(printf "%02d" $n)
  # 3a. Phone: portrait 1080 x 1920 as captured, plus a captioned copy (caption above, the shot framed below).
  if [ -f "$CAP/portrait/$name.png" ]; then
    cp "$CAP/portrait/$name.png" "$OUT/phone/$num-$name.png"
    ff -i "$CAP/portrait/$name.png" -f lavfi -i "color=c=0x0c0a14:s=1080x1920" -filter_complex \
      "[1]drawbox=x=0:y=0:w=1080:h=1920:color=0x1b1430@0.9:t=fill,drawtext=fontfile='$FONT_B':text='${CAPTION[$name]}':fontsize=64:fontcolor=0xF1D9A0:x=(w-tw)/2:y=118:shadowcolor=black:shadowx=2:shadowy=3,drawbox=x=440:y=214:w=200:h=2:color=0xC99A55:t=fill[bg];[0]scale=900:-1[s];[s]pad=iw+4:ih+4:2:2:color=0xC99A55[sf];[bg][sf]overlay=(W-w)/2:286" \
      -frames:v 1 "$OUT/phone-captioned/$num-$name.png"
  fi
  # 3b. Tablets: the landscape (tablet layout) set, 1920 x 1080, used for both 7" and 10".
  if [ -f "$CAP/landscape/$name.png" ]; then
    cp "$CAP/landscape/$name.png" "$OUT/tablet-7/$num-$name.png"
    cp "$CAP/landscape/$name.png" "$OUT/tablet-10/$num-$name.png"
  fi
  # 3c. PC: the PC-layout landscape set, once captured.
  if [ -f "$CAP/landscape-pc/$name.png" ]; then cp "$CAP/landscape-pc/$name.png" "$OUT/pc/$num-$name.png"; fi
done

# 4. Site previews (img/shots, 1280 x 720 webp): each shot from the PC set when captured, else the landscape set.
declare -A SITE_NAME=([1-board]=01-expedition-board [2-moonhaven]=02-moonhaven [3-ritual]=03-ritual [4-fight]=04-combo
  [5-art]=05-forbidden-art-sunfall [6-realm]=06-realm [7-map]=07-realm-map [8-duel]=08-ritual-duel)
for name in "${!SITE_NAME[@]}"; do
  src="$CAP/landscape-pc/$name.png"; [ -f "$src" ] || src="$CAP/landscape/$name.png"
  [ -f "$src" ] && ff -i "$src" -vf "scale=1280:-2" -quality 80 "$SITE/img/shots/${SITE_NAME[$name]}.webp"
done

# 5. Site videos (only with --videos): web re-encodes of playstore-final/video/, each with a poster at its best moment
#    (overview: the Sunfall pillar). The combo videos are YouTube embeds (data-yt in index.html); their posters
#    media/combo-*.webp are frames of combo-landscape at 43 s and combo-portrait at 36 s.
if [[ " $* " == *" --videos "* ]]; then
  VID="$OUT/video"
  enc() { # name, width, crf, poster second
    [ -f "$VID/$1.mp4" ] || { echo "skip $1 (not in $VID)"; return; }
    ff -i "$VID/$1.mp4" -c:v libx264 -crf "$3" -preset slow -vf "scale=$2:-2" -c:a aac -b:a 128k -movflags +faststart "$SITE/media/$1.mp4"
    ff -ss "$4" -i "$VID/$1.mp4" -frames:v 1 -vf "scale=$2:-2" -quality 80 "$SITE/media/$1.webp"
  }
  enc overview-pc 1280 27 60
  enc overview-phone 720 28 60
fi

echo "Play Store set: $OUT"
find "$OUT" -type f | sed "s|$OUT/||" | sort
