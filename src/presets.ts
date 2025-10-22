import { getPreferenceValues } from "@raycast/api";

export interface ConfettiPreferences {
  confettiSound: boolean;
  defaultEmojis?: string;
  defaultIcon?: string;
  defaultPresetName?: string;
  emojiPresets?: string;
}

export interface ConfettiPreset {
  id: string;
  name: string;
  emojis: string;
  icon?: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface ConfettiConfiguration {
  preferences: Required<Pick<ConfettiPreferences, "confettiSound">> & {
    defaultEmojis: string;
    defaultIcon?: string;
    defaultPresetName?: string;
  };
  presets: ConfettiPreset[];
  activePreset: ConfettiPreset;
}

const FALLBACK_EMOJIS = "🎉🎊🥳✨🎈🎆";
const DEFAULT_PRESET_NAME = "Default Confetti";

export function loadConfettiConfiguration(): ConfettiConfiguration {
  const preferences = getPreferenceValues<ConfettiPreferences>();

  const normalizedDefaultEmojis = sanitizeEmojiString(preferences.defaultEmojis, {
    fallback: FALLBACK_EMOJIS,
  })!;

  const defaultPreset = buildPreset({
    id: "default",
    name: DEFAULT_PRESET_NAME,
    emojis: normalizedDefaultEmojis,
    icon: resolveIcon(preferences.defaultIcon, normalizedDefaultEmojis),
    isDefault: true,
  });

  const customPresets = parseCustomPresets(preferences.emojiPresets ?? "");

  const desiredDefaultName = preferences.defaultPresetName?.trim().toLowerCase();
  const presetMatch = desiredDefaultName
    ? customPresets.find((preset) => preset.name.toLowerCase() === desiredDefaultName)
    : undefined;

  const activePreset = presetMatch ?? defaultPreset;
  if (presetMatch) {
    presetMatch.isDefault = true;
  }

  return {
    preferences: {
      confettiSound: preferences.confettiSound ?? true,
      defaultEmojis: normalizedDefaultEmojis,
      defaultIcon: preferences.defaultIcon,
      defaultPresetName: preferences.defaultPresetName,
    },
    presets: [defaultPreset, ...customPresets],
    activePreset,
  };
}

function parseCustomPresets(raw: string): ConfettiPreset[] {
  const lines = raw
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      const parts = line
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length < 2) {
        console.log(`Ignoring preset definition because it is missing a name or emojis: "${line}"`);
        return undefined;
      }

      const [name, emojiPart, iconPart] = parts;
      const emojis = sanitizeEmojiString(emojiPart);
      if (!emojis) {
        console.log(`Ignoring preset definition because no valid emoji were found: "${line}"`);
        return undefined;
      }

      const icon = resolveIcon(iconPart, emojis);

      return buildPreset({
        id: `custom-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        emojis,
        icon,
        isCustom: true,
      });
    })
    .filter(Boolean) as ConfettiPreset[];
}

function buildPreset(preset: ConfettiPreset): ConfettiPreset {
  const uniqueId = preset.id || `preset-${Math.random().toString(36).slice(2, 10)}`;
  const name = preset.name?.trim() || DEFAULT_PRESET_NAME;
  const emojis = preset.emojis;
  const icon = preset.icon ?? resolveIcon(undefined, emojis);

  return {
    ...preset,
    id: uniqueId,
    name,
    emojis,
    icon,
  };
}

function resolveIcon(icon: string | undefined, emojis: string): string | undefined {
  const trimmedIcon = icon?.trim();
  if (trimmedIcon) {
    return trimmedIcon;
  }

  const graphemes = toGraphemeArray(emojis);
  return graphemes[0];
}

export function sanitizeEmojiString(
  value: string | undefined,
  { fallback }: { fallback?: string } = {}
): string | undefined {
  const withoutWhitespace = (value ?? "").replace(/\s+/g, "");
  if (!withoutWhitespace) {
    return fallback;
  }

  const graphemes = toGraphemeArray(withoutWhitespace);
  const limited = graphemes.slice(0, 6);
  const sanitized = limited.join("");

  if (!sanitized && fallback) {
    return fallback;
  }

  return sanitized || undefined;
}

function toGraphemeArray(value: string): string[] {
  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(segmenter.segment(value), (segment) => segment.segment).filter(Boolean);
    }
  } catch (error) {
    console.log("Falling back to Array.from for emoji segmentation", error);
  }

  return Array.from(value).filter(Boolean);
}
