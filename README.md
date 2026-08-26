# Nebula — a deep-space theme for Pi

A colour theme for the [Pi CLI](https://github.com/badlogic/pi-mono) coding agent, built
around a deep-space palette: violet and indigo backgrounds, starlight text, and cyan /
aurora / comet accents.

Ships in **two variants**:

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

## Install

### As a Pi package (recommended)

```bash
pi install git:github.com/radiano2/pi-theme-nebula
```

Then pick it with `/theme` inside Pi, or set it in `~/.pi/agent/settings.json`:

```json
{ "theme": "nebula" }
```

### Manually

Copy either file into your global themes directory:

```bash
mkdir -p ~/.pi/agent/themes
curl -o ~/.pi/agent/themes/nebula.json \
  https://raw.githubusercontent.com/radiano2/pi-theme-nebula/main/themes/nebula.json
curl -o ~/.pi/agent/themes/nebula-deep.json \
  https://raw.githubusercontent.com/radiano2/pi-theme-nebula/main/themes/nebula-deep.json
```

Pi discovers themes from:

- Global: `~/.pi/agent/themes/*.json`
- Project: `.pi/themes/*.json` (after the project is trusted)
- Packages: a `themes/` directory or a `pi.themes` entry in `package.json`

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
