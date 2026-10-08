export type LightingPreset = "estudio" | "atardecer" | "galeria" | "noche";

type Vec3 = [number, number, number];

export type LightingConfig = {
  id: LightingPreset;
  label: string;
  hint: string;
  swatch: string;
  background: string;
  dark: boolean;
  ambient: number;
  key: { color: string; intensity: number; position: Vec3 };
  fill: { color: string; intensity: number; position: Vec3 };
  rim: { color: string; intensity: number; position: Vec3 };
  envIntensity: number;
  formers: {
    form: "rect" | "circle" | "ring";
    color: string;
    intensity: number;
    position: Vec3;
    scale: Vec3;
  }[];
  shadowColor: string;
  shadowOpacity: number;
};

export const LIGHTING: Record<LightingPreset, LightingConfig> = {
  estudio: {
    id: "estudio",
    label: "Estudio",
    hint: "Luz neutra para ver el color real",
    swatch: "linear-gradient(135deg,#ffffff,#e9dfcf)",
    background: "radial-gradient(circle at 50% 35%, #ffffff 0%, #f4eee4 55%, #e7dccb 100%)",
    dark: false,
    ambient: 0.45,
    key: { color: "#ffffff", intensity: 2.2, position: [3, 4, 5] },
    fill: { color: "#f6efe4", intensity: 0.8, position: [-4, 2, 2] },
    rim: { color: "#ffffff", intensity: 1.2, position: [0, 3, -5] },
    envIntensity: 1,
    formers: [
      { form: "rect", color: "#ffffff", intensity: 2, position: [0, 5, -2], scale: [10, 3, 1] },
      { form: "rect", color: "#fff8ef", intensity: 1.2, position: [-5, 1, 0], scale: [3, 6, 1] },
      { form: "rect", color: "#ffffff", intensity: 1.2, position: [5, 1, 0], scale: [3, 6, 1] },
    ],
    shadowColor: "#5c5246",
    shadowOpacity: 0.42,
  },
  atardecer: {
    id: "atardecer",
    label: "Atardecer",
    hint: "Luz cálida de las 5 p. m.",
    swatch: "linear-gradient(135deg,#ffd9b0,#d9875a)",
    background: "radial-gradient(circle at 30% 30%, #fff1df 0%, #f2d3ae 50%, #d9a77d 100%)",
    dark: false,
    ambient: 0.3,
    key: { color: "#ffb36b", intensity: 2.8, position: [-4, 2.5, 3] },
    fill: { color: "#ffd9b0", intensity: 0.6, position: [4, 1, 2] },
    rim: { color: "#ff9257", intensity: 1.8, position: [3, 2, -4] },
    envIntensity: 0.9,
    formers: [
      { form: "rect", color: "#ffb36b", intensity: 2.4, position: [-5, 2, 2], scale: [4, 6, 1] },
      { form: "circle", color: "#ff9257", intensity: 2, position: [4, 3, -4], scale: [3, 3, 1] },
      { form: "rect", color: "#fff1df", intensity: 0.6, position: [0, 6, 0], scale: [8, 2, 1] },
    ],
    shadowColor: "#6b3f22",
    shadowOpacity: 0.5,
  },
  galeria: {
    id: "galeria",
    label: "Galería",
    hint: "Luz de día fría y difusa",
    swatch: "linear-gradient(135deg,#f3f5f1,#c9d5bc)",
    background: "linear-gradient(180deg, #f6f8f3 0%, #e3eadc 100%)",
    dark: false,
    ambient: 0.6,
    key: { color: "#eef4ff", intensity: 1.8, position: [0, 6, 2] },
    fill: { color: "#e3eadc", intensity: 0.9, position: [-3, 2, 3] },
    rim: { color: "#d6e4ff", intensity: 1, position: [2, 2, -4] },
    envIntensity: 1.1,
    formers: [
      { form: "rect", color: "#f4f8ff", intensity: 2.2, position: [0, 6, 0], scale: [8, 8, 1] },
      { form: "ring", color: "#e3eadc", intensity: 1, position: [0, 1, 5], scale: [4, 4, 1] },
    ],
    shadowColor: "#3c4a36",
    shadowOpacity: 0.34,
  },
  noche: {
    id: "noche",
    label: "Noche",
    hint: "Contraste dramático tipo vitrina",
    swatch: "linear-gradient(135deg,#3a3833,#0f0e0c)",
    background: "radial-gradient(circle at 50% 30%, #3a3833 0%, #1b1a17 60%, #0f0e0c 100%)",
    dark: true,
    ambient: 0.12,
    key: { color: "#ffffff", intensity: 3, position: [2, 5, 3] },
    fill: { color: "#8fa47d", intensity: 0.45, position: [-3, 1, 2] },
    rim: { color: "#c9d5bc", intensity: 2.4, position: [-2, 3, -4] },
    envIntensity: 0.55,
    formers: [
      { form: "rect", color: "#ffffff", intensity: 1.6, position: [2, 4, 3], scale: [2, 4, 1] },
      { form: "rect", color: "#8fa47d", intensity: 0.8, position: [-4, 1, -2], scale: [2, 5, 1] },
    ],
    shadowColor: "#000000",
    shadowOpacity: 0.7,
  },
};

export const LIGHTING_LIST: LightingConfig[] = Object.values(LIGHTING);
