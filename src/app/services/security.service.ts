import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserModel } from '../modelos/user.model';
import { HttpClient } from '@angular/common/http';
import { ConfigurationRoutesBackend } from '../config/configuration.routes.backend';
import { UserValidateModel } from '../modelos/user.validate.model';
import { ItemMenuModel } from '../modelos/item.menu.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  urlBase: string = ConfigurationRoutesBackend.urlBackend;

  constructor(private http: HttpClient) {
    this.SessionValidate();
  }

  /**
   * Sign in
   * @param document_number 
   * @param password 
   * @returns Observable<{ access_token: string }>
   */
  SignIn(document_number: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.urlBase}sign-in`, {
      DNI: document_number,
      Password: password
    });
  }

  /**
   * Store the token after login
   * @param token 
   */
  StoreToken(token: string) {
    localStorage.setItem('token', token);  // Guarda el token
    console.log('Token guardado en localStorage:', token);  // Verifica si el token se almacena
  }

  /**
   * Get the token stored
   * @returns string | null
   */
  GetToken(): string | null {
    return localStorage.getItem('token');  // Obtiene el token JWT
  }

  /**
   * Remove token
   */
  RemoveLoggedUserData() {
    console.log('removiendo token');
    localStorage.removeItem('token');
    this.UpdateUserBehavior(new UserValidateModel());
  }

  /** User session management */
  validatedUser = new BehaviorSubject<UserValidateModel>(new UserValidateModel());

  GetDataSession(): Observable<UserValidateModel> {
    return this.validatedUser.asObservable();
  }

  SessionValidate() {
    let token = this.GetToken();
    console.log('Verificando token en SessionValidate:', token); // Agregar esto para depurar
    if (token) {
      // Si el token está presente, actualiza el estado de la sesión
      this.UpdateUserBehavior({
        user: undefined,  // No tienes datos de usuario por ahora
        token: token
      });
    }
  }

  /**
   * Update the BehaviorSubject for the user session
   * @param data 
   * @returns 
   */
  UpdateUserBehavior(data: UserValidateModel) {
    console.log('actualizando datos de usuario', data);
    return this.validatedUser.next(data);
  }

  /**
   * 
   * @returns list of menu items
   */
  GetItemsSideMenu(): ItemMenuModel[]{
    let menuStr = localStorage.getItem("side-menu");
    let menu: ItemMenuModel[] = [];
    if(menuStr){
      menu = JSON.parse(menuStr);
    }
    return menu;
  }
}
