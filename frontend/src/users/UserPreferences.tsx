import { useEffect, useState } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import type { Theme as ThemeType, AccentPalette } from "../context/ThemeContext";

type MessagePreview = "full" | "name-only" | "none";

interface Preferences {
  theme: ThemeType;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  messagePreview: MessagePreview;
  use24HourClock: boolean;
  compactMode: boolean;
}

const DEFAULT_PREFS: Preferences = {
  theme: "light",
  notificationsEnabled: true,
  soundEnabled: true,
  messagePreview: "full",
  use24HourClock: false,
  compactMode: false,
};

const STORAGE_KEY = "collabspace_preferences";

interface UserPreferencesProps {
  onBack: () => void;
}

export default function UserPreferences({ onBack: _onBack }: UserPreferencesProps) {
  const { theme: currentTheme, setTheme, accentPalette, setAccentPalette } = useTheme();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // Keep local prefs.theme in sync with context
  useEffect(() => {
    setPrefs((prev) => ({ ...prev, theme: currentTheme }));
  }, [currentTheme]);

  const updatePref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    // If updating theme, also push to ThemeContext so it takes effect immediately
    if (key === "theme") {
      setTheme(value as ThemeType);
    }
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    toast.success("Preferences saved");
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const themeOptions: { value: ThemeType; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const paletteOptions: { value: AccentPalette; label: string; swatch: string; ring: string }[] = [
    { value: "indigo",   label: "Indigo",   swatch: "bg-indigo-500",  ring: "ring-indigo-500"  },
    { value: "violet",   label: "Violet",   swatch: "bg-violet-500",  ring: "ring-violet-500"  },
    { value: "blue",     label: "Blue",     swatch: "bg-blue-500",    ring: "ring-blue-500"    },
    { value: "sky",      label: "Sky",      swatch: "bg-sky-500",     ring: "ring-sky-500"     },
    { value: "teal",     label: "Teal",     swatch: "bg-teal-500",    ring: "ring-teal-500"    },
    { value: "emerald",  label: "Emerald",  swatch: "bg-emerald-500", ring: "ring-emerald-500" },
    { value: "amber",    label: "Amber",    swatch: "bg-amber-500",   ring: "ring-amber-500"   },
    { value: "rose",     label: "Rose",     swatch: "bg-rose-500",    ring: "ring-rose-500"    },
    { value: "pink",     label: "Pink",     swatch: "bg-pink-500",    ring: "ring-pink-500"    },
  ];

  const previewOptions: { value: MessagePreview; label: string; description: string }[] = [
    { value: "full", label: "Full preview", description: "Show sender name and message text" },
    { value: "name-only", label: "Name only", description: "Only show who sent the message" },
    { value: "none", label: "Hidden", description: "No content in notifications" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="w-full px-6 py-4">
          <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-none">Preferences</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Customize your experience</p>
        </div>
      </div>

      <div className="flex-1 w-full px-6 py-7 space-y-5">
        {/* Theme */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-1">Appearance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Choose your preferred color theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updatePref("theme", value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  prefs.theme === value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Accent palette */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Accent Color</p>
            <div className="flex flex-wrap gap-3">
              {paletteOptions.map(({ value, label, swatch, ring }) => (
                <button
                  key={value}
                  onClick={() => setAccentPalette(value)}
                  title={label}
                  className={`w-9 h-9 rounded-full transition-all ${
                    accentPalette === value
                      ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${ring} scale-110`
                      : "hover:scale-105"
                  } ${swatch}`}
                >
                  {accentPalette === value && (
                    <span className="flex items-center justify-center w-full h-full">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {paletteOptions.find((p) => p.value === accentPalette)?.label ?? "Indigo"}
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white">Notifications</h3>

          {/* Enable notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  prefs.notificationsEnabled
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {prefs.notificationsEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Desktop Notifications
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Get notified when you receive messages
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updatePref("notificationsEnabled", !prefs.notificationsEnabled)
              }
              className={`relative w-11 h-6 rounded-full transition-all ${
                prefs.notificationsEnabled ? "bg-indigo-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  prefs.notificationsEnabled ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  prefs.soundEnabled
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {prefs.soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Notification Sounds
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Play a sound for incoming messages
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePref("soundEnabled", !prefs.soundEnabled)}
              className={`relative w-11 h-6 rounded-full transition-all ${
                prefs.soundEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  prefs.soundEnabled ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Message Preview</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Control what shows in notification popups
          </p>
          <div className="space-y-2">
            {previewOptions.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => updatePref("messagePreview", value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  prefs.messagePreview === value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    prefs.messagePreview === value
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-slate-300 dark:border-slate-500"
                  }`}
                >
                  {prefs.messagePreview === value && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white">Display</h3>

          {/* 24-hour clock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  24-Hour Clock
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use 24-hour time format (e.g. 14:00)
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePref("use24HourClock", !prefs.use24HourClock)}
              className={`relative w-11 h-6 rounded-full transition-all ${
                prefs.use24HourClock ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  prefs.use24HourClock ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Compact mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Compact Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reduce spacing between messages
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePref("compactMode", !prefs.compactMode)}
              className={`relative w-11 h-6 rounded-full transition-all ${
                prefs.compactMode ? "bg-purple-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  prefs.compactMode ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="pb-6">
          <Button onClick={handleSave} fullWidth>
            {saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved
              </span>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
