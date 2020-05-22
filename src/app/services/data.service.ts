import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  isUpdatingRecord$ = new BehaviorSubject<boolean>(null);
  currentStudent$ = new BehaviorSubject<any>(null);
  // currentStudent$: any;
  currentFinancialDoc$ = new BehaviorSubject<any>(null);
  currentFinancialCategoryObj$ =  new BehaviorSubject<any>(null);
  balance$ = new BehaviorSubject<any>(null);
  financialCategories = [
    {key: 'tuition', value: 'Tuition'},
    {key: 'lunch', value: 'Lunch'},
    {key: 'extendedCare', value: 'Extended Care'},
    {key: 'misc', value: 'Tech/Book Fee'},
  ];

  chargesSubcollection: string;
  paymentsSubcollection: string;
  feesSubcollection: string;
  financialDoc: any;

  constructor(private afs: AngularFirestore) {}

  convertMapToArray(map: {}) {
    const keys = Object.keys(map);
    return keys.map(key => map[`${key}`]);
  }

  convertArrayToMapWithUUid(arr: any[]) {
    const map = {};
    arr.forEach(obj => {
      const uuid = obj.id || this.afs.createId();
      obj.id = uuid;
      map[`${uuid}`] = obj;
    });
    return map;
  }

  setStudent(student) {
    this.currentStudent$.next(student);
    // this.currentStudent$ = this.afs.collection('students').doc(student.id).valueChanges();
  }

}
