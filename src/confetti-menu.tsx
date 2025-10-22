import { Icon, LaunchType, MenuBarExtra, environment, openCommandPreferences } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { shootConfetti } from "./common";
import { loadConfettiConfiguration } from "./presets";

export default function Command() {
  const configuration = useMemo(() => loadConfettiConfiguration(), []);
  const [hasFired, setHasFired] = useState(false);
  const { activePreset, preferences, presets } = configuration;

  useEffect(() => {
    if (!hasFired && environment.launchType === LaunchType.UserInitiated) {
      setHasFired(true);
      shootConfetti({
        playSound: preferences.confettiSound,
        emojis: activePreset.emojis,
      });
    }
  }, [activePreset.emojis, hasFired, preferences.confettiSound]);

  const icon = activePreset.icon ?? preferences.defaultIcon ?? "🎉";

  return (
    <MenuBarExtra isLoading={false} icon={icon} tooltip="1-Click Confetti">
      <MenuBarExtra.Section title="Presets">
        {presets.map((preset) => (
          <MenuBarExtra.Item
            key={preset.id}
            title={preset.name}
            subtitle={preset.isDefault ? "Default" : undefined}
            icon={preset.icon}
            onAction={() =>
              shootConfetti({
                playSound: preferences.confettiSound,
                emojis: preset.emojis,
              })
            }
          />
        ))}
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Open Extension Preferences" icon={Icon.Gear} onAction={openCommandPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
