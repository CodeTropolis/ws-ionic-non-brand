import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, Route, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate  {

  constructor(private auth: AuthService, private router: Router) { }

  // canLoad only works for lazy loaded modules.
  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    return this.allow();
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.allow();
  }

  private allow(): Observable<boolean> {
     return this.auth.authState.pipe(
      take(1),
      map(state => {
        return !!state;
      }),
      tap(loggedIn => {
        if (!loggedIn) {
          console.log('access denied');
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
