import type {
  PasswordChallengeInput,
  PasswordChallengeServiceDeps,
} from '../../types/authProviderTypes';

export const passwordChallengeService = async (
  args: PasswordChallengeInput,
  { authProvider }: PasswordChallengeServiceDeps
) => {
  try {
    const { username, newPassword, session } = args;
    const response = await authProvider.passwordChallenge({
      session,
      username,
      newPassword,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default passwordChallengeService;
