import { inferAdditionalFields } from "better-auth/client/plugins";

export const extraFieldsForType = inferAdditionalFields({
  user: {
    phoneNumber: {
      type: "string",
      defaultValue: null,
      required: false,
    },
    language: {
      type: "string",
      defaultValue: "en-US",
      required: false,
    },
    timezone: {
      type: "string",
      defaultValue: "UTC",
      required: false,
    },
    timeFormat: {
      type: "string",
      defaultValue: "dd MMM yyyy, hh:mm a",
      required: false,
    },
    bio: {
      type: "string",
      defaultValue: null,
      required: false,
    },
    department: {
      type: "string",
      defaultValue: null,
      required: false,
    },
    beltCode: {
      type: "string",
      defaultValue: null,
      required: false,
    },
    affiliates: {
      type: "string",
      defaultValue: null,
      required: false,
    },
  },
});
