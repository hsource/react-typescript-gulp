export const serializedUserAttributes = [
  'id',
  'email',
  'username',
  'activated',
];

export interface SerializedUser {
  id: number;
  email: string;
  username: string;
  activated: boolean;
}

export interface SuccessResponse {
  success: true;
  messages: string[];
  data: any;
}

export interface FailedResponse {
  success: false;
  messages: string[];
  errTypes: string[];
}

export type Response = SuccessResponse | FailedResponse;
