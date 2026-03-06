import type {
  PasswordChallengeInput,
  PasswordChallengeServiceDeps,
} from '../../types/authProviderTypes';

export const passwordChallengeService = async (
  args: PasswordChallengeInput,
  { authProvider }: PasswordChallengeServiceDeps
) => {
  const { username, newPassword, session } = args;
  const response = await authProvider.passwordChallenge({
    session,
    username,
    newPassword,
  });
  return response;
};

export default passwordChallengeService;
