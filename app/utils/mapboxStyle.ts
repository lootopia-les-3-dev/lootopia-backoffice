const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches

export const mapboxStyle = "mapbox://styles/mapbox/standard"
export const mapboxLightPreset = isDark ? "night" : "day"
