import type { ITokenProvider, TokenProviderDeps } from '../types/tokenProvider';
import { createSessionRedis } from './jwtTokenProvider/createSessionRedis';
import { deleteOrgSessions } from './jwtTokenProvider/deleteOrgSessions';
import { getOrgSessionsWithRefreshTokens } from './jwtTokenProvider/getAllSessionsByOrgId';
import { getSessionById } from './jwtTokenProvider/getSessionByIdRedis';
import { revokeSessionRedis } from './jwtTokenProvider/revokeSessionRedis';
import { revokeUserOrgSessions } from './jwtTokenProvider/revokeUserOrgSessions';
import { rotateSessionRedis } from './jwtTokenProvider/rotateSessionRedis';
import { verifyAccessToken } from './jwtTokenProvider/verifyAccessToken';
import { verifyRefreshToken } from './jwtTokenProvider/verifyRefreshToken';

export const tokenProvider = ({
  client,
  singleSession = true,
}: TokenProviderDeps): ITokenProvider => ({
  createSession: async (args) =>
    createSessionRedis({ ...args, singleSession }, { redisClient: client }),
  refreshToken: (args) => rotateSessionRedis({ ...args, singleSession }, { redisClient: client }),
  revokeSession: async ({ sessionId, refreshToken }) => {
    await revokeSessionRedis({ sessionId, refreshToken }, { redisClient: client });
  },
  revokeUserOrgSessions: ({ userId, organizationId }) =>
    revokeUserOrgSessions({ userId, organizationId }, { redisClient: client }),
  verifyAccessToken: (args) => verifyAccessToken(args),
  getSessionById: (args) => getSessionById(args, { redisClient: client }),
  getOrgSessions: (args) => getOrgSessionsWithRefreshTokens(args, { redisClient: client }),
  deleteOrgSessions: (args) => deleteOrgSessions(args, { redisClient: client }),
  verifyRefreshToken: (args) => verifyRefreshToken(args, { redisClient: client }),
});
