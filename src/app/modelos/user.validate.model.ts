import { UserModel } from "./user.model";

export class UserValidateModel {
    user?: UserModel;
    token?: string = "";
}