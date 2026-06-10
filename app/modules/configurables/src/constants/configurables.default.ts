/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TMaxwellLevel = {
  level: number;
  name: string;
  description: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline?: string;
  welcomeMessage?: string;
  coachName?: string;
  chatPlaceholder?: string;
  ctaLabel?: string;
  showLevelIndicator?: boolean;
  maxwellLevels?: TMaxwellLevel[];
  footerText?: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Influence Coach",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#38aa56",
    secondary: "#111111",
    accent: "#38aa56",
  },
  tagline: "Build Your Leadership Influence with Maxwell's 5 Levels",
  welcomeMessage:
    "Welcome! I'm your Influence Coach. I help leaders like you understand where you stand in Maxwell's 5 Levels of Leadership and give you clear, actionable steps to grow your influence. Tell me about your leadership situation and let's get started.",
  coachName: "Influence Coach",
  chatPlaceholder: "Describe your leadership situation or ask about your influence...",
  ctaLabel: "Start Coaching",
  showLevelIndicator: true,
  maxwellLevels: [
    { level: 1, name: "Position", description: "People follow because they have to" },
    { level: 2, name: "Permission", description: "People follow because they want to" },
    { level: 3, name: "Production", description: "People follow because of what you've done for the organization" },
    { level: 4, name: "People Development", description: "People follow because of what you've done for them" },
    { level: 5, name: "Pinnacle", description: "People follow because of who you are and what you represent" },
  ],
  footerText: "Influence Coach — Powered by Maxwell's 5 Levels of Leadership",
};
