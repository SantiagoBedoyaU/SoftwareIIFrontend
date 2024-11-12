export class UserModel {
    id?: string;
    typeDNI?: string;
    dni?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    role?: number;
    phone?: string;
    address?: string;
  
    constructor(init?: Partial<UserModel>) {
      Object.assign(this, init); // Asigna los valores opcionalmente.
    }
  }