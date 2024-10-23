import { UserModel } from './user.model';

export class UserValidateModel {
  user?: UserModel;
  token: string = '';

  constructor(init?: Partial<UserValidateModel>) {
    Object.assign(this, init); // Asigna los valores opcionalmente.
  }
}