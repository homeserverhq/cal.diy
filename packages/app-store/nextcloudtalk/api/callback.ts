import type { NextApiRequest, NextApiResponse } from "next";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import prisma from "@calcom/prisma";

import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import createOAuthAppCredential from "../../_utils/oauth/createOAuthAppCredential";
import { decodeOAuthState } from "../../_utils/oauth/decodeOAuthState";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const state = decodeOAuthState(req);
  const userId = req.session?.user.id;
  if (!userId) {
    return res.status(404).json({ message: "No user found" });
  }
  const { code } = req.query;
  const appKeys = await getAppKeysFromSlug("nextcloudtalk");
  const hostUrl = appKeys.nextcloudTalkHost as string;
  const client_id = appKeys.nextcloudTalkClientId as string;
  const client_secret = appKeys.nextcloudTalkClientSecret as string;

  const result = await fetch(`${hostUrl}/index.php/apps/oauth2/api/v1/token`, {
    method: "POST",
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id,
      client_secret,
      redirect_uri: `${WEBAPP_URL}/api/integrations/nextcloudtalk/callback`,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (result.status !== 200) {
    let errorMessage = "Something is wrong with the Nextcloud API";
    try {
      const responseBody = await result.json();
      errorMessage = responseBody.error;
    } catch (e) {}

    res.status(400).json({ message: errorMessage });
    return;
  }

  const responseBody = await result.json();
  if (responseBody.error) {
    res.status(400).json({ message: responseBody.error });
    return;
  }

  // Remove previous OAuth credentials, but keep app-password credentials created by provisioning.
  const existingCredentials = await prisma.credential.findMany({
    where: {
      type: "nextcloudtalk_video",
      userId,
      appId: "nextcloudtalk",
    },
    select: {
      id: true,
      key: true,
    },
  });
  const oauthCredentialIds = existingCredentials
    .filter(({ key }) => {
      if (!key || typeof key !== "object" || Array.isArray(key)) {
        return false;
      }
      return (key as Record<string, unknown>).authType !== "app-password";
    })
    .map(({ id }) => id);
  if (oauthCredentialIds.length > 0) {
    await prisma.credential.deleteMany({
      where: {
        id: {
          in: oauthCredentialIds,
        },
      },
    });
  }

  await createOAuthAppCredential({ appId: "nextcloudtalk", type: "nextcloudtalk_video" }, responseBody, req);

  res.redirect(
    getSafeRedirectUrl(state?.returnTo) ??
      getInstalledAppPath({ variant: "conferencing", slug: "nextcloudtalk" })
  );
}
