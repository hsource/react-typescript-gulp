import { inject } from 'mobx-react';
import { observable, action } from 'mobx';
import { SerializedUser } from '../../../common/types';
import { getLoggedInUser, logout } from '../User';

export interface AuthStoreData {
  user?: SerializedUser;
}

export class AuthStore {
  @observable
  user?: SerializedUser | null;
  @observable
  userLoading: boolean;
  @observable
  userError: string | null = null;

  constructor(store?: AuthStoreData | null) {
    if (store) {
      Object.assign(this, store);
    }
  }

  private async withLoading<T>(action: () => Promise<T>) {
    this.userLoading = true;
    this.userError = null;
    try {
      const result = await action();
      this.userLoading = false;
      return result;
    } catch (err) {
      this.userLoading = false;
      this.userError = err.message;
      throw err;
    }
  }

  @action
  refreshUser = async () => {
    return this.withLoading(async () => {
      const user = await getLoggedInUser();
      this.user = user;
      return user;
    });
  };

  @action
  logout = async () => {
    return this.withLoading(async () => {
      await logout();
      this.user = null;
    });
  };
}

export interface AuthInjectedProps {
  user?: SerializedUser | null;
  userLoading: boolean;
  userError: string | null;
  refreshUser: () => Promise<SerializedUser | null>;
  logout: () => Promise<void>;
}

export const withAuth = inject(
  ({ store: { auth } }): AuthInjectedProps => {
    const authStore = auth as AuthStore;
    const { user, userLoading, userError, refreshUser, logout } = authStore;
    return { user, userLoading, userError, refreshUser, logout };
  },
);
