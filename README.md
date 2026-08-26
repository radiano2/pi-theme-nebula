# Nebula — a deep-space theme + starfield for Pi

A colour theme **and** an animated background for the [Pi CLI](https://github.com/badlogic/pi-mono)
coding agent, built around a deep-space palette: violet and indigo backgrounds, starlight
text, and cyan / aurora / comet accents.

## What's included

- **Two theme variants** (`nebula`, `nebula-deep`) — the colour palette
- **A starfield extension** — an animated parallax starfield with nebula clouds and comets,
  rendered live in a widget band above (or below) the editor

They're designed as a pair — the starfield only emits foreground colours, so it reads
correctly against the theme's backgrounds — but each works fine on its own.

## Theme variants

| Variant | Look | Best for |
|---|---|---|
| `nebula` | Message and tool backgrounds are **transparent**, so your terminal background (and any blur/opacity) shows through | Terminals with a custom background image, translucency, or a colour you want to keep |
| `nebula-deep` | Message and tool backgrounds are **filled** with tinted panels (`#1a1430`, `#141225`, `#10201f`, `#2a1424`) | A solid, self-contained look with clearly separated panels |

Both share exactly the same palette — the only difference is whether the panel backgrounds
are painted or left to the terminal.

## Palette

| Name | Hex | Used for |
|---|---|---|
| `starlight` | `#e8ecff` | primary text |
| `ice` | `#a8d8ff` | secondary text |
| `cyan` | `#67e8f9` | accent borders |
| `violet` | `#a78bfa` | main accent |
| `magenta` | `#f472b6` | highlights |
| `gold` | `#fcd34d` | warnings |
| `aurora` | `#5eead4` | success |
| `comet` | `#60a5fa` | links / info |
| `dust` | `#8b86b8` | muted text |
| `deepdust` | `#5b5680` | borders |
| `crimson` | `#ff6b81` | errors |
| `nebulaBg` | `#1a1230` | selection background (`nebula`) |
| `voidBg` | `#12101f` | deepest background (`nebula`) |

## The starfield extension

A live-rendered widget: drifting parallax stars in three depth layers, slow nebula clouds
(value noise, not random static), and comets that streak across the band. Only foreground
colours are emitted — no background is painted — so your terminal's own background (and any
transparency) shows through underneath it.

It reacts to the agent: a **warp effect** kicks in automatically while the agent is
thinking (stars stretch into streaks, speed ramps up) and eases back once it settles. It
also installs a matching orbiting-moon working indicator (◐◓◑◒ in theme colours).

### Commands

| Command | Effect |
|---|---|
| `/space` | toggle the starfield on/off |
| `/space on` / `/space off` | explicit on/off |
| `/space height N` | band height in rows (1–20) |
| `/space density N` | star density percent (1–40) |
| `/space nebula N` | nebula cloud coverage percent (0–100) |
| `/space warp` | trigger a manual warp burst |
| `/space above` / `/space below` | move the band above or below the editor |

## Install

### As a Pi package (recommended)

```bash
pi install git:github.com/radiano2/pi-theme-nebula
```

This installs **both** theme variants and the starfield extension in one step. Pick a theme
with `/theme` inside Pi, or set it in `~/.pi/agent/settings.json`:

```json
{ "theme": "nebula" }
```

The starfield is on by default; toggle it with `/space off` if you'd rather have a plain
editing area.

### Manually

Copy the theme files into your global themes directory, and the extension into your global
extensions directory:

```bash
mkdir -p ~/.pi/agent/themes ~/.pi/agent/extensions
curl -o ~/.pi/agent/themes/nebula.json \
  https://raw.githubusercontent.com/radiano2/pi-theme-nebula/main/themes/nebula.json
curl -o ~/.pi/agent/themes/nebula-deep.json \
  https://raw.githubusercontent.com/radiano2/pi-theme-nebula/main/themes/nebula-deep.json
curl -o ~/.pi/agent/extensions/starfield.ts \
  https://raw.githubusercontent.com/radiano2/pi-theme-nebula/main/extensions/starfield.ts
```

Pi discovers these from:

- Themes — global `~/.pi/agent/themes/*.json`, project `.pi/themes/*.json`, or a package's
  `themes/` directory / `pi.themes` entry
- Extensions — global `~/.pi/agent/extensions/*.ts`, project `.pi/extensions/*.ts`, or a
  package's `pi.extensions` entry

## Customising

Both files follow Pi's theme schema (referenced via `$schema`, so editors give you
autocomplete and validation). Colours are defined once under `vars` and referenced by name
under `colors`, so you can re-tint the whole theme by changing a single variable — for
example, swapping `violet` changes every accent at once.

```jsonc
{
  "vars": { "violet": "#a78bfa" },   // change here...
  "colors": { "accent": "violet" }   // ...and every accent follows
}
```

See Pi's [themes documentation](https://github.com/badlogic/pi-mono) for the full list of
supported colour keys.

## License

MIT © Anton Radionov
