import policy from './policy.json';
export const WEATHER = ['seed', 'clear', 'rain', 'snow', 'mist', 'dust', 'ash'] as const;
export const TIMES = ['seed', 'dawn', 'noon', 'sunset', 'night'] as const;
export type Weather = Exclude<(typeof WEATHER)[number], 'seed'>;
export type Time = Exclude<(typeof TIMES)[number], 'seed'>;
export interface AtmosphereSpec {
  biome: string;
  radius: number;
  layoutSeed?: number;
  daylight?: string;
  sunAngle?: number;
}
export interface AtmosphereInput {
  sunlight?: string;
  weatherKind?: string;
  weather?: boolean;
}

/** One resolved state drives light, fog, precipitation and practical emission in both scenes. */
export function atmosphereProfile(spec: AtmosphereSpec, input: AtmosphereInput = {}) {
  const seed = spec.layoutSeed ?? 1;
  const automatic: Weather = ['snow', 'tundra', 'frozen'].includes(spec.biome)
    ? 'snow'
    : spec.biome === 'volcanic'
      ? 'ash'
      : ['desert', 'oasis', 'wasteland'].includes(spec.biome)
        ? 'dust'
        : ['caves', 'mushroom'].includes(spec.biome)
          ? 'mist'
          : 'rain';
  const weather: Weather =
    input.weather === false
      ? 'clear'
      : WEATHER.includes(input.weatherKind as (typeof WEATHER)[number]) && input.weatherKind !== 'seed'
        ? (input.weatherKind as Weather)
        : automatic;
  const seeded =
    seed % 6 === 0 ? 'night' : (spec.daylight ?? ['sunset', 'night', 'dawn', 'noon'][seed % 4] ?? 'sunset');
  const time: Time =
    TIMES.includes(input.sunlight as (typeof TIMES)[number]) && input.sunlight !== 'seed'
      ? (input.sunlight as Time)
      : TIMES.includes(seeded as Time)
        ? (seeded as Time)
        : 'sunset';
  const night = time === 'night',
    overcast = weather === 'rain' || weather === 'snow' || weather === 'ash';
  const base = night ? policy.light.night : time === 'noon' ? policy.light.noon : policy.light.evening;
  return {
    time,
    weather,
    night,
    overcast,
    key: base.key * (overcast ? 0.42 : 1),
    sky: base.sky * (overcast ? 1.32 : 1),
    fill: base.fill,
    elevation: base.elevation,
    haze: weather === 'mist' ? 1.1 : overcast ? 1.65 : weather === 'dust' ? 1.8 : 3.8,
    emission: night ? 2.4 : time === 'noon' ? 0.22 : 1.25,
    particleCount: weather === 'clear' ? 0 : weather === 'mist' ? policy.mistInstances : policy.maxWeatherParticles,
    wind: weather === 'rain' ? 0.22 : weather === 'snow' ? 0.09 : 0.16,
  };
}
export type AtmosphereProfile = ReturnType<typeof atmosphereProfile>;
