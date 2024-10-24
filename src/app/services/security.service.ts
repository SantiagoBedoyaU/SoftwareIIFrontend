import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationRoutesBackend } from '../config/configuration.routes.backend';
import { UserValidateModel } from '../modelos/user.validate.model';
import { ItemMenuModel } from '../modelos/item.menu.model';
import { MENU_ROLES, MenuItem } from '../config/configuration.sidebar';
import { UserModel } from '../modelos/user.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private logoutEvent = new Subject<void>();
  menuItems = new BehaviorSubject<MenuItem[]>([]);
  urlBase: string = ConfigurationRoutesBackend.urlBackend;

  constructor(private http: HttpClient) {
    this.SessionValidate();
  }

  /**
   * Get the user data
   * @returns 
   */
  GetUserData(): Observable<any> {
    const token = this.GetToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    console.log('Headers enviados:', headers);

    return this.http.get(`${this.urlBase}users/me`, { headers });
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
    }).pipe(
      tap(response => {
        console.log('Respuesta de inicio de sesión:', response);

        // Almacena el token y luego valida la sesión
        this.StoreToken(response.access_token);

        // Espera brevemente antes de validar la sesión para asegurar propagación
        setTimeout(() => this.SessionValidate(), 50);
      })
    );
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
    return localStorage.getItem('token'); // Obtiene el token del almacenamiento local.
  }

  // Observable que los componentes escucharán.
  getLogoutEvent() {
    return this.logoutEvent.asObservable();
  }

  RemoveLoggedUserData() {
    console.log('Removiendo token y cerrando sesión');
    localStorage.removeItem('token');
    this.UpdateUserBehavior(new UserValidateModel()); // Limpia el estado del usuario.
    this.menuItems.next([]); // Limpia los ítems del menú.

    this.logoutEvent.next(); // Emite el evento de cierre de sesión.
  }

  /** User session management */
  validatedUser = new BehaviorSubject<UserValidateModel>(new UserValidateModel());

  GetDataSession(): Observable<UserValidateModel> {
    return this.validatedUser.asObservable();
  }

  SessionValidate() {
    const token = this.GetToken();

    if (token) {
      this.GetUserData().subscribe(userData => {
        const validatedUser = new UserValidateModel({
          user: new UserModel(userData), // Almacena los datos correctamente.
          token: token
        });

        this.UpdateUserBehavior(validatedUser);
        this.UpdateMenu(userData.Role ? +userData.Role : 0);
      });
    } else {
      this.UpdateUserBehavior(new UserValidateModel());
    }
  }

  /**
   * Actualiza el menú según el rol del usuario.
   */
  UpdateMenu(roleId: number) {
    const items = MENU_ROLES[roleId] || []; // Selecciona ítems del menú por rol
    this.menuItems.next(items); // Actualiza los ítems del menú
  }

  /**
   * Obtiene el observable de los ítems del menú.
   */
  GetMenuItems(): Observable<MenuItem[]> {
    return this.menuItems.asObservable();
  }

  /**
   * Update the BehaviorSubject for the user session
   * @param data 
   * @returns 
   */
  UpdateUserBehavior(data: UserValidateModel) {
    console.log('Actualizando datos de usuario:', data);
    this.validatedUser.next(data); // Actualiza el BehaviorSubject con los nuevos datos.
  }

  /**
   * 
   * @returns list of menu items
   */
  GetItemsSideMenu(): ItemMenuModel[] {
    let menuStr = localStorage.getItem("side-menu");
    let menu: ItemMenuModel[] = [];
    if (menuStr) {
      menu = JSON.parse(menuStr);
    }
    return menu;
  }

  /**
   * Request to recover the password 
   * @param dni 
   * @returns 
   */
  recoverPassword(dni: string): Observable<any> {
    return this.http.post(`${this.urlBase}recover-password`, { dni });
  }


  /**
   * Reset the password
   * @param token 
   * @param password 
   * @returns 
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.urlBase}reset-password`, {
      access_token: token,
      password: password
    }
    );
  }
}
