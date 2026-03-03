import { logger } from '@/shared/utils/logger';
import { deleteUserFromCognito, deleteUsersBySubArray } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type { DeleteUserCognitoDeps } from '../../types/authProviderTypes';

export const deleteUserCognito = async (id: string, deps: DeleteUserCognitoDeps): Promise<any> => {
  try {
    const { client, userPoolId } = deps;
    if (!userPoolId) {
      logger.error('User pool ID is required for deleting user');
      throw new AuthRequestError('Failed to delete user');
    }
    await deleteUserFromCognito({
      username: id,
      client,
      userPoolId,
    });
    logger.info('User deleted from Cognito', { id });
    return { id };
  } catch (error) {
    logger.error('Error in deleteUserCognito', { error });
    throw new AuthRequestError('Failed to delete user');
  }
};

export const deleteUserManyCognito = async (
  ids: string[],
  deps: DeleteUserCognitoDeps
): Promise<any> => {
  try {
    const { client, userPoolId } = deps;
    if (!userPoolId) {
      logger.error('User pool ID is required for deleting user');
      throw new AuthRequestError('Failed to delete user');
    }

    await deleteUsersBySubArray({
      client,
      userPoolId,
      subsArray: ids,
    });

    logger.info('Users deleted from Cognito', { count: ids.length });
    return { ids };
  } catch (error) {
    logger.error('Error in deleteUserManyCognito', { error });
    throw new AuthRequestError('Failed to delete user');
  }
};
