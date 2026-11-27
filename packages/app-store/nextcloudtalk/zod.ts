import { z } from "zod";

export const appKeysSchema = z.object({
  nextcloudTalkHost: z.string(),
  nextcloudTalkPattern: z.string().optional(),
  nextcloudTalkClientId: z.string().optional(),
  nextcloudTalkClientSecret: z.string().optional(),
});

export const appDataSchema = z.object({});
