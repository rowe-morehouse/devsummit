/**
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Express from 'express';
import cookieParser from 'cookie-parser';

import { Context } from './types.js';
import { asyncMiddleware, alwaysNextMiddleware } from './utils.js';

export interface CookieValue {
  userId: string;
  // Expiry date as a timestamp
  expires: number;
}

export default function sessionMiddleware() {
  return alwaysNextMiddleware(
    asyncMiddleware(async (req: Express.Request, res: Express.Response) => {
      const context = res.locals as Context;
      await new Promise(resolve =>
        cookieParser(context.cookieSecret)(req, res, resolve),
      );
      req.cookies[context.cookieName];
      const { userId, expires } = req.signedCookies[context.cookieName];
      if (new Date().getTime() > expires) {
        return;
      }
      context.userId = userId;
    }),
  );
}

export function setSessionCookie(req: Express.Request, res: Express.Response) {
  const context = res.locals as Context;
  const cookieValue = {
    userId: context.userId,
    expires: new Date().getTime() + context.sessionLength * 1000,
  };

  res.cookie(context.cookieName, cookieValue, {
    httpOnly: true,
    maxAge: context.sessionLength * 1000,
    signed: true,
  });
}

export function unsetSessionCookie(
  req: Express.Request,
  res: Express.Response,
) {
  const context = res.locals as Context;
  res.clearCookie(context.cookieName, { signed: true, httpOnly: true });
}
