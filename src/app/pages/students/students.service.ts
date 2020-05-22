import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subject, combineLatest, BehaviorSubject, Observable, zip, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class StudentService {

  results$ = new Subject<any>();
  studentsAdded$ = new BehaviorSubject<any>(null);
  // private resultArray: any[] = [];
  searchText$: Subject<string> = new Subject();
  searchTextValue: string;

  constructor(private afs: AngularFirestore) { }

  getRecordsBySearch(searchText: any): Observable<any> {
    if (searchText) {

      let altSearchText;
      // If user enters last name starting with lowercase, this will not work
      // Possible solution: save last name as both lnameCap: Doe and lnameLowerCase: doe and query for both.
      altSearchText =  searchText[0].toUpperCase() + searchText.slice(1);

      const fNameRef = this.afs.collection('students', ref => ref.where('fname', '==', altSearchText));
      const lNameRef = this.afs.collection('students', ref => ref.where('lname', '==', altSearchText));
      const gradeRef = this.afs.collection('students', ref => ref.where('grade', '==', altSearchText));

      const combined = zip(
        fNameRef.snapshotChanges(),
        lNameRef.snapshotChanges(),
        gradeRef.snapshotChanges(),
      );
      // return this.zipObservables(combined);
      return combined.pipe(
        switchMap(docs => {
        console.log(`MD: docs`, docs);
        const [fNameDocs, lNameDocs, gradeDocs] = docs;
        const c = fNameDocs.concat(lNameDocs, gradeDocs);
        return of(c);
        }),
        // tap(arr => console.log(`${arr.length} reads on students collection`)),
        map(changes => {
        return changes.map(c => {
          const data = c.payload.doc.data();
          // console.log(`MD: StudentService -> constructor -> data`, data);
          return data;
          });
        }),
      );
    }
   }

   getRecordsByEmail(email: string): Observable<any> {
    if (email) {
      const fatherEmailRef = this.afs.collection('students', ref => ref.where('fatherEmail', '==', email));
      const motherEmailRef = this.afs.collection('students', ref => ref.where('motherEmail', '==', email));
      const combined = zip(
        fatherEmailRef.snapshotChanges(),
        motherEmailRef.snapshotChanges(),
      );
      // return this.zipObservables(combined);
      return combined.pipe(
        switchMap(docs => {
        const [fatherEmailDocs, motherEmailDocs] = docs;
        const c = fatherEmailDocs.concat(motherEmailDocs);
        return of(c);
        }),
        // tap(arr => console.log(`${arr.length} reads on students collection`)),
        map(changes => {
        return changes.map(c => {
          const data = c.payload.doc.data();
          return data;
          });
        }),
      );
    }
   }

  //  zipObservables(combined: Observable<any>): Observable<any> {
  //   return combined.pipe(
  //     switchMap(docs => {
  //     console.log(`MD: docs`, docs);
  //     docs.forEach((d, idx) => {

  //     })
  //     // const [fNameDocs, lNameDocs, gradeDocs] = docs;
  //     // const c = fNameDocs.concat(lNameDocs, gradeDocs);
  //     return of(c);
  //     }),
  //     tap(arr => console.log(`${arr.length} reads on students collection`)),
  //     map(changes => {
  //     return changes.map(c => {
  //       const data = c.payload.doc.data();
  //       return data;
  //       });
  //     }),
  //   );
  //  }

  // getRecordsBySearch(searchText: any) {

  // //  const lnameRes = this.afs.collection('students', ref => {
  // //   console.log(`MD: getRecordsBySearch -> ref`, ref);
  // //   return ref.where('fname', '==', searchText);
  // //   });

  //   this.resultArray = [];
  //   this.results$.next([]);
  //   if (searchText) {
  //     // console.log(`MD: StudentService -> getRecordsBySearch -> searchText`, searchText);
  //     const studentsRef = this.afs.collection('students').ref;
  //     const fnameQuery = studentsRef.where('fname', '==', searchText);
  //     const lnameQuery = studentsRef.where('lname', '==', searchText);
  //     const gradeQuery = studentsRef.where('grade', '==', searchText);
  //     const queries = [fnameQuery, lnameQuery, gradeQuery];
  //     this.processQueries(queries);
  //   }
  // }

  // getRecordsByEmail(email: string) {
    // this.resultArray = [];
    // this.results$.next([]);
    // const studentsRef = this.afs.collection('students').ref;
    // const fe = studentsRef.where('fatherEmail', '==', email);
    // const me = studentsRef.where('motherEmail', '==', email);
    // const queries = [fe, me];
    // this.processQueries(queries);
  // }

  // public processQueries(queries: Array<any>): Promise<any> {
  //   public processQueries(queries: Array<any>) {
  //   // const promises: Promise<any>[] = [];
  //   queries.forEach(query => {
  //   query.onSnapshot(querySnapshot => {
  //     // console.log(`MD: processQueries -> querySnapshot`, querySnapshot);
  //     querySnapshot.docs.forEach((queryDocumentSnapshot) => {
  //       const data = queryDocumentSnapshot.data();
  //       this.resultArray.push(data);
  //       this.results$.next(this.resultArray);
  //       // promises.push(data);
  //       });
  //       // Prevent duplicates in array.  Duplication occurs upon a saved edit (assuming there was an actual change).
  //     const u = this.resultArray.filter((e, i) => this.resultArray.findIndex(a => a.id === e.id) === i);
  //     this.results$.next(u);
  //      });
  //   });
  //   // return Promise.all(promises);
  // }
}
