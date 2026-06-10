/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
      maxLength: 120,
    },
    {
      fieldName: "welcomeMessage",
      type: "string",
      required: false,
      label: "Welcome Message",
      maxLength: 500,
    },
    {
      fieldName: "coachName",
      type: "string",
      required: false,
      label: "Coach Name",
      maxLength: 60,
    },
    {
      fieldName: "chatPlaceholder",
      type: "string",
      required: false,
      label: "Chat Input Placeholder",
      maxLength: 120,
    },
    {
      fieldName: "ctaLabel",
      type: "string",
      required: false,
      label: "Start Button Label",
      maxLength: 60,
    },
    {
      fieldName: "showLevelIndicator",
      type: "boolean",
      required: false,
      label: "Show Level Indicator in Chat",
    },
    {
      fieldName: "maxwellLevels",
      type: "array",
      required: false,
      label: "Maxwell 5 Levels (labels)",
      item: {
        type: "object",
        fields: [
          { fieldName: "level", type: "number", required: true, label: "Level Number" },
          { fieldName: "name", type: "string", required: true, label: "Level Name" },
          { fieldName: "description", type: "string", required: false, label: "Short Description" },
        ],
      },
    },
    {
      fieldName: "footerText",
      type: "string",
      required: false,
      label: "Footer Text",
      maxLength: 160,
    },
  ],
};
