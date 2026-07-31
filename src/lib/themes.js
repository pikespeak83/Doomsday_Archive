/** Shader palettes for each UI style. */
export const THEME_FX = {
  green: { tint: "#7dff3f", glitch: ["#123006", "#3f8a1f", "#7dff3f"] },
  amber: { tint: "#ffab26", glitch: ["#33200a", "#a3690f", "#ffab26"] },
  crimson: { tint: "#ff5240", glitch: ["#330a05", "#a52c1e", "#ff5240"] },
  mono: { tint: "#d9e8dc", glitch: ["#161816", "#6b756d", "#d9e8dc"] },
  cobalt: { tint: "#3fa9ff", glitch: ["#061a30", "#1f5f9e", "#3fa9ff"] },
  gold: { tint: "#ffd23f", glitch: ["#2b1f05", "#9e7d18", "#ffd23f"] },
  vault: { tint: "#ffd23f", glitch: ["#0a1c33", "#1f4f8f", "#ffd23f"] }
};

/** Bundled map backdrops and the style that matches each one. */
export const BUNDLED_BACKDROPS = {
  emerald: { image: "assets/backdrops/emerald.jpg", theme: "green", label: "EMERALD MAP" },
  ember: { image: "assets/backdrops/ember.jpg", theme: "amber", label: "EMBER MAP" },
  crimson: { image: "assets/backdrops/crimson.jpg", theme: "crimson", label: "CRIMSON MAP" },
  onyx: { image: "assets/backdrops/onyx.jpg", theme: "mono", label: "ONYX MAP" },
  circuit: { image: "assets/backdrops/circuit.jpg", theme: "cobalt", label: "BLUE CIRCUIT" },
  gold: { image: "assets/backdrops/gold.jpg", theme: "gold", label: "GOLD GRID" },
  vaultec: { image: "assets/backdrops/vaultec.jpg", theme: "vault", label: "VAULT-TEC POSTER" }
};

/** Style pickers shown in settings and desktop menus. */
export const THEME_CHOICES = [
  ["green", "PHOSPHOR GREEN"],
  ["amber", "AMBER ALERT"],
  ["crimson", "CRIMSON PROTOCOL"],
  ["mono", "GHOST MONO"],
  ["cobalt", "COBALT CIRCUIT"],
  ["gold", "GOLD STANDARD"],
  ["vault", "VAULT-TEC"]
];
