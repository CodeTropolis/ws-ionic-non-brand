import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  form: FormGroup;
  isLoggingIn$: Subject<boolean>;
  creatingAccount: boolean;
  status$: Observable<string>;
  error$: Observable<string>;
  isResettingPassword$: Observable<boolean>;
  disableButton: boolean;

  private unsubscribe$ = new Subject();
  user;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private screenOrientation: ScreenOrientation,
    public platform: Platform
  ) { }

  ngOnInit() {

    if (this.platform.is('capacitor')) {
      this.platform.ready().then(() => {
        console.log('Screen orientation: ', this.screenOrientation.type); // logs the current orientation, example: 'landscape'
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      });
    }

    this.authService.user$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(user => this.user = user);

    this.isLoggingIn$ = this.authService.isLoggingIn$; // subscription via async pipe

    // Navigate only after custom user data write is confirmed else
    // 'missing or insufficient perms...' upon first login.
    this.authService.userDataWritten$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(x => {
      if (x && this.user) {
        this.router.navigate(['students']);
      }
    });

    this.authService.disableLoginOrCreateButton$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(x => {
      this.disableButton = x;
    });

    this.status$ = this.authService.status$;
    this.error$ = this.authService.error$;
    this.isResettingPassword$ = this.authService.isResettingPassword$;
    this.authService.isResettingPassword$.next(false);

    this.authService.creatingAccount$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(x => {
      this.creatingAccount = x;
    });

    this.authService.isResettingPassword$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(x => {
      if (x) {
        this.form = this.fb.group({
          email: ['', [Validators.required, Validators.email]]
        });
      } else {
        this.form = this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          password: ['', Validators.required]
        });
      }
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;
  }

  signUp() {
    const e = this.form.value.email;
    const p = this.form.value.password;
    this.authService.signUp(e, p);
  }

  createAccount(formDirective) {
    this.authService.isResettingPassword$.next(false);
    this.resetForm(formDirective);
    this.authService.creatingAccount$.next(true);
    this.authService.disableLoginOrCreateButton$.next(false);
    // Clear out errors that occur if user attempted to login without first creating an account
    this.authService.error$.next('');
    this.authService.status$.next('');
  }

  emailLogin(formDirective) {
    this.authService.error$.next('');
    this.authService.status$.next('');
    const e = this.form.value.email;
    const p = this.form.value.password;
    this.authService.emailLogin(e, p);
    this.resetForm(formDirective);
  }

   beginPasswordReset(formDirective) {
    // Clear out previously displayed errors or status
    this.authService.error$.next('');
    this.authService.status$.next('');
    this.authService.isResettingPassword$.next(true);
    this.resetForm(formDirective);
  }

   cancelPasswordReset(formDirective) {
    // Clear out previously displayed errors or status
    this.authService.error$.next('');
    this.authService.status$.next('');
    this.authService.isResettingPassword$.next(false);
    this.resetForm(formDirective);
  }

   passwordReset(formDirective) {
    this.authService.resetPassword(this.form.value.email);
    this.authService.isResettingPassword$.next(false);
    this.resetForm(formDirective);
  }

  cancelCreateAccount(formDirective) {
    this.authService.error$.next('');
    this.authService.status$.next('');
    this.creatingAccount = false;
    this.resetForm(formDirective);
  }


  private resetForm(formDirective) {
    formDirective.resetForm(); // See https://stackoverflow.com/a/48217303
    this.form.reset();
  }

  // ngOnDestroy() {
  //   console.log(`MD: LoginPage -> ngOnDestroy -> ngOnDestroy`);
  //   this.unsubscribe$.next();
  //   this.unsubscribe$.complete();
  // }

  ionViewDidLeave() {
    console.log(`MD: LoginPage -> ionViewDidLeave -> ionViewDidLeave()`);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
