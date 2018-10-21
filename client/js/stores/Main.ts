import { inject } from 'mobx-react';

interface MainStoreData {}

/** A store to rule them all: top-level store */
export class MainStore {
  constructor(data?: MainStoreData) {
    // Do nothing
  }
}

export type InjectedProps = {};

function injecter({ store }: { store: MainStore }) {
  return {};
}

/**
 * Connect props and dispatcher for accessing and
 * retrieving travelers tied to an account
 */
export const withMain = inject(injecter);

export default { MainStore, withMain };
