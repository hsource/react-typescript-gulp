import axios from 'axios';
import { SerializedUser } from '../../common/types';
import { processResponse } from './Ajax';

export async function getLoggedInUser(): Promise<SerializedUser | null> {
  const response = await axios({ url: '/api/user' });
  return processResponse(response);
}

export async function logout(): Promise<void> {
  await axios({ url: '/api/user/logout', method: 'POST' });
}
