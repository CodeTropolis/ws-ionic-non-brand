import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { User } from 'src/models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User>;
  status$ = new BehaviorSubject<string>(null);
  error$ = new BehaviorSubject<string>(null);
  isLoggingIn$ = new BehaviorSubject<boolean>(null);
  isResettingPassword$ = new BehaviorSubject<boolean>(null);
  creatingAccount$ = new BehaviorSubject<boolean>(false);
  userDataWritten$ = new BehaviorSubject<boolean>(false);
  disableLoginOrCreateButton$ = new BehaviorSubject<boolean>(null);

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
    ) {

      this.user$ = this.afAuth.authState.pipe(
        switchMap(user => {
          if (user) {
            return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
          } else {
            return of(null);
          }
        })
      );

    }
    public signUp(e, p) {
      this.disableLoginOrCreateButton$.next(true);
      const promise = this.afAuth.auth.createUserWithEmailAndPassword(e, p);
      promise.then(success => {
        this.error$.next('');
        const user: any = this.afAuth.auth.currentUser;
        user
          .sendEmailVerification()
          .then(_ => {
            this.creatingAccount$.next(false);
            this.status$.next(
              `Verification email sent.` +
              ` It is possible that the email was sent to your spam folder. Once verified, you may return to the app and login.`
            );
          })
          .catch(err => {
            console.log(err);
            this.error$.next(err);
          });
        this.disableLoginOrCreateButton$.next(false);
      });
      promise.catch(err => {
        console.log(err);
        this.error$.next(err);
        // Perhaps the user tried to create an account when it already exists so switch back to login or create account UI.
        this.creatingAccount$.next(false);
        this.disableLoginOrCreateButton$.next(false);
      });
    }

    public emailLogin(e, p) {
      // this.disableLoginOrCreateButton$.next(true);
      this.isLoggingIn$.next(true);
      this.status$.next('');
      const promise = this.afAuth.auth.signInWithEmailAndPassword(e, p);
      promise.then(credential => {
        this.isLoggingIn$.next(false);
        // this.disableLoginOrCreateButton$.next(false);
        if (this.afAuth.auth.currentUser.emailVerified) {
          // Determine if user exists as entry in the users collection.  If not, create user with custom data.
          const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${credential.user.uid}`);
          // Only set user data if new user.
          // If the user does not yet exist in the users collection then determined to be first login.
          // Did it this way because the additionalInfo.isNewUser property on the native auth object is always false.
          userRef.ref.get().then(doc => {
            if (!doc.exists) {
              this.writeCustomUserData(userRef, credential.user);
            } else {
              // user data will exist for logins after first login so set userDataWritten$ to true.
              this.userDataWritten$.next(true);
            }
          });
        } else {
          this.error$.next(
            `Email not verified. If you have already signed up, please visit your` +
            `inbox and verify your email.  Once verified, you may return to the app and login`
          );
        }
      });
      promise.catch(err => {
        this.isLoggingIn$.next(false);
        if (err.code === 'auth/user-not-found') {
          this.error$.next('User account not found.  Please create an account.');
        } else {
          console.log(err);
          this.error$.next(err.message);
        }
      });
    }


  private writeCustomUserData(userRef, user) {

    // Every user should have the same custom data in regards to roles.
    // At this point, users are converted to admin users via Firebase console.

    const data: User = {
      uid: user.uid,
      email: user.email,
      roles: {
        admin: false,
        subscriber: true
      }
    };

    userRef.set(data, { merge: true }).then( () => {
      console.log('User data has been set.');
      this.userDataWritten$.next(true);
    });

  }

  resetPassword(email: string) {
    return this.afAuth.auth
      .sendPasswordResetEmail(email)
      .then(() => {
        console.log('email sent');
        this.status$.next(
          `Password reset instructions have been sent to ${email}.`
        );
      })
      .catch(err => {
        console.log(err);
        if (err.code === 'auth/user-not-found') {
          this.error$.next('User account not found.  Please create an account.');
        } else {
          console.log(err);
          this.error$.next(err.message);
        }
      });
  }

  logOut() {
     this.afAuth.auth.signOut()
    .then(() => {
      // Prevent 'Missing or insufficient permissions...' errors upon logout.
      // See https://medium.com/@dalenguyen/handle-missing-or-insufficient-permissions-firestore-error-on-angular-or-ionic-bf4edb7a7c68
      // window.location.reload();
    });
  }

  get authState() {
    return this.afAuth.authState;
  }
}
