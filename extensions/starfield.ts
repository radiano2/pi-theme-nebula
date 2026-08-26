/**
 * Starfield — animated semi-transparent space background for pi.
 *
 * Renders a drifting parallax starfield with nebula clouds and shooting stars
 * in a widget band above the editor. Only foreground colors are emitted, so the
 * terminal background (and any transparency / blur you configured) shows through.
 *
 * Pairs with the `nebula` theme (~/.pi/agent/themes/nebula.json).
 *
 * Commands:
 *   /space            toggle the starfield on/off
 *   /space on|off
 *   /space height N   band height in rows (1-20)
 *   /space density N  star density percent (1-40)
 *   /space nebula N   nebula cloud amount percent (0-100)
 *   /space warp       trigger a manual warp burst
 *   /space below      move the band below the editor
 *   /space above      move the band above the editor
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// ---------------------------------------------------------------- config ----

const WIDGET_ID = "starfield";
const FRAME_MS = 90;

type Config = {
	enabled: boolean;
	height: number;
	density: number; // percent of cells that hold a star
	nebula: number; // percent: how much of the band is covered by clouds
	placement: "aboveEditor" | "belowEditor";
};

const config: Config = {
	enabled: true,
	height: 5,
	density: 9,
	nebula: 30,
	placement: "aboveEditor",
};

// ----------------------------------------------------------------- color ----

const RESET = "\x1b[0m";
const fg = (r: number, g: number, b: number) =>
	`\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m`;

type RGB = [number, number, number];

const STAR_COLORS: RGB[] = [
	[232, 236, 255], // starlight
	[168, 216, 255], // ice blue
	[103, 232, 249], // cyan
	[167, 139, 250], // violet
	[244, 114, 182], // magenta
	[252, 211, 77], // gold
];

const NEBULA_A: RGB = [92, 58, 148]; // violet cloud
const NEBULA_B: RGB = [148, 55, 118]; // magenta cloud

const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a: RGB, b: RGB, t: number): RGB => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
];

// ----------------------------------------------------------------- noise ----

function hash2(x: number, y: number): number {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return s - Math.floor(s);
}

function smooth(t: number): number {
	return t * t * (3 - 2 * t);
}

/** Value noise in [0,1]. */
function noise2(x: number, y: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = smooth(x - xi);
	const yf = smooth(y - yi);
	const a = hash2(xi, yi);
	const b = hash2(xi + 1, yi);
	const c = hash2(xi, yi + 1);
	const d = hash2(xi + 1, yi + 1);
	return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
}

// ------------------------------------------------------------- simulation ----

type Star = {
	x: number; // float column
	y: number; // row
	layer: 0 | 1 | 2; // parallax depth: 0 far … 2 near
	glyph: string;
	color: RGB;
	phase: number; // twinkle phase
	twinkle: number; // twinkle speed
};

type Comet = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	len: number;
	life: number;
};

const FAR_GLYPHS = ["·", ".", "·", "˙"];
const MID_GLYPHS = ["·", "*", "+", "✧"];
const NEAR_GLYPHS = ["✦", "✧", "*", "★", "✵"];
const LAYER_SPEED = [0.05, 0.13, 0.27];
const LAYER_BRIGHT = [0.42, 0.7, 1.0];

class Starfield {
	private stars: Star[] = [];
	private comets: Comet[] = [];
	private width = 0;
	private t = 0;
	private warp = 0; // 0..1 eased warp intensity
	warpTarget = 0;

	private seed(width: number, height: number): void {
		this.width = width;
		this.stars = [];
		const count = Math.max(8, Math.round((width * height * config.density) / 100));
		for (let i = 0; i < count; i++) {
			const layer = (Math.random() < 0.5 ? 0 : Math.random() < 0.65 ? 1 : 2) as 0 | 1 | 2;
			const glyphs = layer === 0 ? FAR_GLYPHS : layer === 1 ? MID_GLYPHS : NEAR_GLYPHS;
			this.stars.push({
				x: Math.random() * width,
				y: Math.floor(Math.random() * height),
				layer,
				glyph: glyphs[Math.floor(Math.random() * glyphs.length)]!,
				color:
					layer === 2
						? STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!
						: STAR_COLORS[Math.floor(Math.random() * 4)]!,
				phase: Math.random() * Math.PI * 2,
				twinkle: 0.05 + Math.random() * 0.18,
			});
		}
	}

	burst(): void {
		this.spawnComet(true);
	}

	private spawnComet(fast = false): void {
		const height = config.height;
		this.comets.push({
			x: this.width + 4,
			y: Math.random() * Math.max(1, height - 1),
			vx: -(fast ? 1.9 : 0.9 + Math.random() * 0.8),
			vy: (Math.random() - 0.5) * 0.22,
			len: 4 + Math.floor(Math.random() * 6),
			life: 1,
		});
	}

	tick(): void {
		this.t += 1;
		// ease warp toward its target
		this.warp += (this.warpTarget - this.warp) * 0.08;

		const boost = 1 + this.warp * 5;
		for (const s of this.stars) {
			s.x -= LAYER_SPEED[s.layer]! * boost;
			if (s.x < -1) {
				s.x += this.width + 2;
				s.y = Math.floor(Math.random() * config.height);
			}
		}

		for (const c of this.comets) {
			c.x += c.vx * (1 + this.warp * 2);
			c.y += c.vy;
		}
		this.comets = this.comets.filter((c) => c.x + c.len > -2 && c.y > -2 && c.y < config.height + 2);

		// random comet spawns, more often during warp
		if (Math.random() < 0.008 + this.warp * 0.05) this.spawnComet();
	}

	render(width: number, height: number): string[] {
		if (width !== this.width || this.stars.length === 0) this.seed(width, height);

		// cell buffers
		const glyph: string[][] = [];
		const color: (RGB | null)[][] = [];
		for (let y = 0; y < height; y++) {
			glyph.push(new Array(width).fill(" "));
			color.push(new Array(width).fill(null));
		}

		// 1. nebula clouds (slow drifting value noise, dim so text stays readable)
		const drift = this.t * 0.006;
		const thr = 1 - (Math.min(100, Math.max(0, config.nebula)) / 100) * 0.62;
		for (let y = 0; y < height && thr < 1; y++) {
			for (let x = 0; x < width; x++) {
				const n = noise2(x * 0.09 + drift, y * 0.28 - drift * 0.4);
				if (n > thr) {
					const k = (n - thr) / Math.max(0.05, 1 - thr); // 0..1
					glyph[y]![x] = k > 0.75 ? "▒" : "░";
					const hue = noise2(x * 0.04 - drift * 0.3, y * 0.2 + 11);
					color[y]![x] = scale(mix(NEBULA_A, NEBULA_B, hue), 0.24 + k * 0.38);
				}
			}
		}

		// 2. stars
		for (const s of this.stars) {
			const x = Math.round(s.x);
			if (x < 0 || x >= width || s.y < 0 || s.y >= height) continue;
			const tw = 0.72 + 0.28 * Math.sin(this.t * s.twinkle + s.phase);
			const bright = LAYER_BRIGHT[s.layer]! * tw;
			// during warp, near stars stretch into streaks
			glyph[s.y]![x] = this.warp > 0.35 && s.layer === 2 ? "─" : s.glyph;
			color[s.y]![x] = scale(s.color, Math.min(1, bright + this.warp * 0.25));
		}

		// 3. comets with fading tails
		for (const c of this.comets) {
			const cy = Math.round(c.y);
			if (cy < 0 || cy >= height) continue;
			for (let i = 0; i < c.len; i++) {
				const x = Math.round(c.x + i);
				if (x < 0 || x >= width) continue;
				const fade = 1 - i / c.len;
				glyph[cy]![x] = i === 0 ? "✦" : fade > 0.55 ? "━" : "─";
				color[cy]![x] = scale([232, 236, 255], 0.25 + fade * 0.75);
			}
		}

		// 4. serialize with color-run compression
		const lines: string[] = [];
		for (let y = 0; y < height; y++) {
			let line = "";
			let last = "";
			for (let x = 0; x < width; x++) {
				const g = glyph[y]![x]!;
				if (g === " ") {
					if (last !== "") {
						line += RESET;
						last = "";
					}
					line += " ";
					continue;
				}
				const c = color[y]![x]!;
				const code = fg(c[0], c[1], c[2]);
				if (code !== last) {
					line += code;
					last = code;
				}
				line += g;
			}
			lines.push(last === "" ? line : line + RESET);
		}
		return lines;
	}
}

// ----------------------------------------------------------------- wiring ----

const field = new Starfield();
let timer: ReturnType<typeof setInterval> | undefined;

function stopTimer(): void {
	if (timer) {
		clearInterval(timer);
		timer = undefined;
	}
}

function mount(ctx: ExtensionContext): void {
	if (!ctx.hasUI || ctx.mode !== "tui") return;
	stopTimer();
	if (!config.enabled) {
		ctx.ui.setWidget(WIDGET_ID, undefined);
		return;
	}

	ctx.ui.setWidget(
		WIDGET_ID,
		(tui) => {
			stopTimer();
			timer = setInterval(() => {
				field.tick();
				tui.requestRender();
			}, FRAME_MS);
			if (typeof timer.unref === "function") timer.unref();
			return {
				render: (width: number) => field.render(Math.max(1, width), config.height),
				invalidate: () => {},
			};
		},
		{ placement: config.placement },
	);
}

export default function starfieldExtension(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		mount(ctx);
		if (ctx.hasUI && ctx.mode === "tui") {
			// orbiting-moon working indicator to match the theme
			ctx.ui.setWorkingIndicator({
				frames: ["\x1b[38;2;167;139;250m◐\x1b[0m", "\x1b[38;2;103;232;249m◓\x1b[0m", "\x1b[38;2;244;114;182m◑\x1b[0m", "\x1b[38;2;252;211;77m◒\x1b[0m"],
				intervalMs: 130,
			});
		}
	});

	// warp drive engages while the agent is thinking
	pi.on("agent_start", () => {
		field.warpTarget = 1;
		field.burst();
	});
	pi.on("agent_settled", () => {
		field.warpTarget = 0;
	});
	pi.on("session_shutdown", () => stopTimer());

	pi.registerCommand("space", {
		description: "Starfield background: on | off | height N | density N | warp | above | below",
		handler: async (args, ctx) => {
			const [cmd, value] = args.trim().split(/\s+/);
			switch (cmd) {
				case "":
				case undefined:
					config.enabled = !config.enabled;
					break;
				case "on":
					config.enabled = true;
					break;
				case "off":
					config.enabled = false;
					break;
				case "height":
					config.height = Math.min(20, Math.max(1, Number(value) || 5));
					config.enabled = true;
					break;
				case "density":
					config.density = Math.min(40, Math.max(1, Number(value) || 9));
					config.enabled = true;
					break;
				case "nebula":
					config.nebula = Math.min(100, Math.max(0, Number(value) ?? 30));
					config.enabled = true;
					break;
				case "above":
					config.placement = "aboveEditor";
					break;
				case "below":
					config.placement = "belowEditor";
					break;
				case "warp":
					field.burst();
					field.warpTarget = 1;
					setTimeout(() => {
						field.warpTarget = 0;
					}, 2500);
					ctx.ui.notify("Warp drive engaged", "info");
					return;
				default:
					ctx.ui.notify(`Unknown: /space ${cmd}`, "warning");
					return;
			}
			mount(ctx);
			ctx.ui.notify(
				config.enabled
					? `Starfield on — ${config.height} rows, ${config.density}% stars, ${config.nebula}% nebula, ${config.placement === "aboveEditor" ? "above" : "below"} editor`
					: "Starfield off",
				"info",
			);
		},
	});
}
