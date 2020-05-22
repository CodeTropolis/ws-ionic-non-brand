import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  // attendanceCollection: AngularFirestoreCollection<any[]>;
  // financialsCollection: AngularFirestoreCollection<any[]>;
  // gradesCollection: AngularFirestoreCollection<any[]>;
  recordsCollection: AngularFirestoreCollection<any[]>;
  studentsCollection: AngularFirestoreCollection<any[]>;

  records$: Observable<any[]>;

  constructor(private afs: AngularFirestore) {

    // this.attendanceCollection = this.afs.collection('attendance');
    // this.financialsCollection = this.afs.collection('financials');
    // this.gradesCollection = this.afs.collection('grades');
    this.recordsCollection = this.afs.collection('records');
    this.studentsCollection = this.afs.collection('students');

    // this.records$ = this.afs.collection('records').valueChanges({idField: 'id'})
    //  .pipe(
    //     tap(arr => console.log(`${arr.length} reads on records collection`)),
    //   );
  }

}
