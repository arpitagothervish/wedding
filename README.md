# Arpita & Vishal — Wedding Website

Single-page, mobile-first wedding invitation site. Static HTML/CSS/JS — ready for GitHub Pages, no build step.

## How to publish on GitHub Pages

1. Create a new GitHub repo (e.g. `wedding-invite`).
2. Upload everything in this folder (`index.html`, `css/`, `js/`, `assets/`) to the repo root.
3. Repo → Settings → Pages → Source: `main` branch, `/ (root)` → Save.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

Videos/audio push the repo size up fast — keep each file compressed (see specs below) so the free GitHub Pages/LFS limits aren't an issue.

## Drop your files into `assets/` using these exact names

The site is already wired to these paths — just replace the files and refresh, no code changes needed.

### 1. Door intro — `assets/videos/`
| File | What it is | Specs |
|---|---|---|
| `door-closed.mp4` | Closed door, looping | Portrait 9:16 (e.g. 1080×1920), 3–6s, loops seamlessly, muted OK, **under ~5MB** |
| `door-open.mp4` | Same door opening, ends fully open | Same framing/lighting as above so the cut feels seamless, 3–8s, can include a knock/creak sound |
| `door-poster.jpg` | First-frame still of the closed door | Used while the video loads |

Guests **double-tap** (mobile) or **double-click** (desktop) the closed-door video → it swaps to the open-door video → when that finishes, the site fades in underneath.

### 2. Hero — couple photo + lanterns — `assets/images/`
| File | What it is | Specs |
|---|---|---|
| `couple-hero.jpg` | Full-length or 3/4 photo of the two of you, standing | Portrait orientation, at least 1200×1600px, well-lit, some empty space above your heads for lanterns to float |
| `lantern-1.png`, `lantern-2.png`, `lantern-3.png` | Chinese sky-lantern graphics (like in *Tangled*) | **Transparent background PNG**, at least 3 different lanterns/angles for variety. These float independently and parallax-scroll slower than the photo for the 3D depth effect. |

If you'd rather not source lantern PNGs, I can generate simple illustrated ones for you — just say so.

### 3. Scratch card — `assets/images/` (optional)
| File | What it is |
|---|---|
| `scratch-overlay.jpg` | Optional gold/lantern-pattern texture for the scratch surface. If you skip this, a gold gradient is used automatically. |

### 4. Schedule — 4 functions — `assets/videos/` + `assets/images/`
For each function, add a short invitation video (preferred) **and** a poster image (shown before the video plays / as fallback):

| Function | Video | Poster |
|---|---|---|
| Haldi | `assets/videos/haldi.mp4` | `assets/images/haldi-poster.jpg` |
| Sangeet | `assets/videos/sangeet.mp4` | `assets/images/sangeet-poster.jpg` |
| Phere | `assets/videos/phere.mp4` | `assets/images/phere-poster.jpg` |
| Reception | `assets/videos/reception.mp4` | `assets/images/reception-poster.jpg` |

Vertical or square clips work best on mobile, 5–15s each, keep each **under ~8MB** for fast loading. If you only have images for some functions, that's fine — just point the `<source>` to a static image workflow or ask me to switch that card to an image.

### 5. Background audio — `assets/audio/`
| File | What it is | Specs |
|---|---|---|
| `bg-music.mp3` | Soft instrumental background track | Loopable, compressed, **under ~5MB** |

There's already a toggle button (bottom-right) so guests can mute it.

### 6. Nice-to-haves
- `assets/images/favicon.png` — small square logo/monogram for the browser tab
- `assets/images/venue.jpg` — a venue photo if you want to add one to the Location section

## Content still to fill in
- Venue full address (Location section) — currently just says "Atrio by Devam"
- Hotel/accommodation name, address, and booking link (Location section)
- Instagram/social link if you want one in the footer
- Double-check all dates/times match your final schedule

## What's already built
- Closed→open door video intro, triggered by double-tap/double-click, then reveals the site
- Parallax hero: lanterns float and scroll at a slower rate than the couple photo behind them for a 3D effect
- Scratch-to-reveal date card (touch + mouse), countdown timer appears automatically once ~50% scratched
- Scroll-triggered fade-in animations on schedule, dress code, and location cards
- Schedule section for Haldi / Sangeet / Phere / Reception, each with its own video
- Dress code section with suggested color palettes per function
- Location section with a "Get Directions" Google Maps button + a stay/accommodation card
- Background music toggle, elegant scroll-dot navigation (desktop), fully responsive for mobile

## Ideas for more elegance (optional, ask me if you want any of these built)
- Swap the countdown for a floral/lantern-illustrated version once you have more graphics
- Add a subtle floating-petal or sparkle particle layer over the whole page
- Add an "Our Story" mini-timeline section between the hero and scratch card
- Add a photo gallery/carousel section
- Add small ambient sound cues (door creak, temple bells) tied to scroll position
