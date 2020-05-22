import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { FirebaseService } from '../../../services/firebase.service';
import { take, switchMap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { StudentService } from '../../students/students.service';
import { of } from 'rxjs';
// import { AngularFireFunctions } from '@angular/fire/functions';
// import { Timestamp } from '@google-cloud/firestore';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.page.html',
  styleUrls: ['./record-form.page.scss'],
})
export class RecordFormPage implements OnInit {

  recordForm: FormGroup;
  currentRecordId: string;
  isUpdating: boolean;
  studentToUpdate: any;
  financialCategories: any[] = [];

  phoneTypes: any[] = [
    { value: 'home', display: 'Home' },
    { value: 'mobile', display: 'Mobile' },
    { value: 'office', display: 'Office' },
    { value: 'other', display: 'Other' }
  ];

  races: any[] = [
    { value: 'african-american', display: 'African-American' },
    { value: 'asian', display: 'Asian' },
    { value: 'caucasian', display: 'Caucasian' },
    { value: 'mixed', display: 'Mixed' },
    { value: 'pacific-islander', display: 'Pacific Islander' },
    { value: 'native-american', display: 'Native American' },
    { value: 'unknown', display: 'Unknown' }
  ];

  gender: any[] = [
    { value: 'male', display: 'Male' },
    { value: 'female', display: 'Female' },
  ];

  grade: any[] = [
    { value: 'PK3', display: 'Pre K 3' },
    { value: 'PK4', display: 'Pre K 4' },
    { value: 'K', display: 'K' },
    { value: '1', display: '1'},
    { value: '2', display: '2' },
    { value: '3', display: '3' },
    { value: '4', display: '4' },
    { value: '5', display: '5' },
    { value: '6', display: '6' },
    { value: '7', display: '7' },
    { value: '8', display: '8' },
  ];

 catholic: any[] = [
    { value: 'catholicYes', display: 'Yes' },
    { value: 'catholicNo', display: 'No' },
  ];

  studentsAdded: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private firebaseService: FirebaseService,
    private afs: AngularFirestore,
    private modalController: ModalController,
    private studentService: StudentService,
    // private fns: AngularFireFunctions,
    // private router: Router,
     ) { }

  ngOnInit() {

    this.buildForm();

    this.financialCategories = this.dataService.financialCategories;

    this.dataService.isUpdatingRecord$.pipe(
      take(1),
      switchMap(x => {
        this.isUpdating = x;
        if (this.isUpdating) {
          return this.dataService.currentStudent$;
        } else {
          this.resetForm();
          return of (null);
        }
      })
      )
      .subscribe(student => {
        if (student) {
          this.currentRecordId = student.recordId;
          this.populateForm();
        }
    });
  }

  private buildForm() {
    this.recordForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      fatherFname: [''],
      fatherLname: [''],
      fatherEmail: [''],
      fatherPhones: this.fb.array([]),
      motherFname: [''],
      motherLname: [''],
      motherEmail: [''],
      motherPhones: this.fb.array([]),
      district: ['', Validators.required],
      catholic: ['', Validators.required],
      children: this.fb.array([]),
    });
    // setTimeout(() => this.populateFormTest(), 500);
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.recordForm.controls;
  }

  get phoneFormFather() {
    return this.recordForm.get('fatherPhones') as FormArray;
  }

  addPhoneFather() {
    const phone = this.fb.group({
      number: ['', Validators.required],
      type: ['', Validators.required],
    });
    this.phoneFormFather.push(phone);
  }

  deletePhoneFather(i) {
    this.phoneFormFather.removeAt(i);
  }

  get phoneFormMother() {
    return this.recordForm.get('motherPhones') as FormArray;
  }

  addPhoneMother() {
    const phone = this.fb.group({
      number: ['', Validators.required],
      type: ['', Validators.required],
    });
    this.phoneFormMother.push(phone);
  }

  deletePhoneMother(i) {
    this.phoneFormMother.removeAt(i);
  }

  get childrenForm() {
    return this.recordForm.get('children') as FormArray;
  }


  addChild() {
    const child = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      dob: ['', Validators.required],
      grade: ['', Validators.required],
      gender: ['', Validators.required],
      race: ['', Validators.required],
      id: [''] // For updating student.
    });
    this.childrenForm.push(child);
  }

  deleteChild(i) {
    this.childrenForm.removeAt(i);
  }

  private populateForm() {
    this.firebaseService.recordsCollection.doc(this.currentRecordId).ref.get().then(record => {
      this.recordForm.patchValue({
        address: record.data().address,
        city: record.data().city,
        state: record.data().state,
        zip: record.data().zip,
        fatherFname: record.data().fatherFname,
        fatherLname: record.data().fatherLname,
        fatherEmail: record.data().fatherEmail,
        motherFname: record.data().motherFname,
        motherLname: record.data().motherLname,
        motherEmail: record.data().motherEmail,
        district: record.data().district,
        catholic: record.data().catholic
      });
      const fp = this.dataService.convertMapToArray(record.data().fatherPhones);
      fp.forEach((p) => {
        const phone = this.fb.group({
          number: p.number,
          type: p.type
        });
        this.phoneFormFather.push(phone);
      });
      const mp = this.dataService.convertMapToArray(record.data().motherPhones);
      mp.forEach((p) => {
        const phone = this.fb.group({
          number: p.number,
          type: p.type
        });
        this.phoneFormMother.push(phone);
      });
    });
    // Get all students associated with the current record.
    const studentsRef = this.afs.collection('students').ref;
    const query = studentsRef.where('recordId', '==', this.currentRecordId);
    query.get().then(querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const timestamp = data.dob.seconds;
        const date = new Date(timestamp * 1000);
        const childData = this.fb.group({
          fname: data.fname,
          lname: data.lname,
          dob: date,
          grade: data.grade,
          gender: data.gender,
          race: data.race,
          id: data.id
        });
        this.childrenForm.push(childData);
      });
    });
  }

  private populateFormTest() {
    console.log(`MD: RecordFormPage -> populateFormTest -> populateFormTest`);
    this.recordForm.patchValue({
      address: '123 Street',
      city: 'Hollywood',
      state: 'CA',
      zip: 12345,
      fatherFname: 'Alex',
      fatherLname: 'a',
      fatherEmail: 'test@gmail.com',
      motherFname: 'Jane',
      motherLname: 'a',
      motherEmail: 'jane@x.com',
      district: 'R5',
      catholic: 'catholicYes',
    });

    const student1 = {
    fname: 'Chase',
    lname: 'a',
    dob: new Date('03/03/2009'),
    grade: '5',
    gender: 'male',
    race: 'caucasian',
  };

    const student2 = {
    fname: 'Tara',
    lname: 'a',
    dob: new Date('03/03/2009'),
    grade: '6',
    gender: 'female',
    race: 'asian',
  };
    const students = [student1, student2];

    students.forEach(doc => {
      const childData = this.fb.group({
        fname: doc.fname,
        lname: doc.lname,
        dob:  doc.dob,
        grade: doc.grade,
        gender: doc.gender,
        race:  doc.race,
        // id: data.id
      });
      this.childrenForm.push(childData);
      });
  }

  submitHandler(formDirective) {
    if (this.recordForm.invalid) { return; }
    const formValue = this.recordForm.value;
    const record: any = {
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      zip: formValue.zip,
      fatherFname: formValue.fatherFname,
      fatherLname: formValue.fatherLname,
      motherFname: formValue.motherFname,
      motherLname: formValue.motherLname,
      fatherEmail: formValue.fatherEmail,
      motherEmail: formValue.motherEmail,
      fatherPhones: this.dataService.convertArrayToMapWithUUid(formValue.fatherPhones),
      motherPhones: this.dataService.convertArrayToMapWithUUid(formValue.motherPhones),
      district: formValue.district,
      catholic: formValue.catholic
    };
    if (this.isUpdating) {
      try {
        // Update current record
        this.firebaseService.recordsCollection.doc(this.currentRecordId).update(record)
          .then(() => {
            // Update doc(s)in students collection which are associated with record
            formValue.children.forEach(child => {
            // If the child exists, it will have an id.
            if (child.id) {
             const childRef =  this.firebaseService.studentsCollection.doc(child.id).ref;
             this.syncRecordPropsToStudent(childRef, child, record, this.currentRecordId);
            } else {
               // The user added a new child to the form.  Add it as a new entry to the students collection.
              this.firebaseService.studentsCollection.add(child)
              .then(childRef => {
                // Add properties from the record doc to the student.
                this.syncRecordPropsToStudent(childRef, child, record, this.currentRecordId);
                this.addSubCollectionsToStudent(childRef, this.currentRecordId);
              });
            }
            });
            this.resetForm(formDirective);
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        // Add a new record
        this.firebaseService.recordsCollection.add(record)
        // Save each child to the top-level students collection.
        .then(recordRef => {
          formValue.children.forEach(child => {
            try {
              this.firebaseService.studentsCollection.add(child)
                .then(childRef => {
                  this.syncRecordPropsToStudent(childRef, child, record, recordRef.id);
                  this.addSubCollectionsToStudent(childRef, recordRef.id);
                  this.resetForm(formDirective);
                });
            } catch (err) {
              console.log(err);
            }
          }
        );
      });
      } catch (err) {
        console.log(err);
      }
    }
  }

  private syncRecordPropsToStudent(childRef, child, record, recordId) {
    // const sync = this.fns.httpsCallable('cfSyncRecordPropsToStudent'); // Yields observable, however, payload from subscribe is null.
    const sync = firebase.functions().httpsCallable('cfSyncRecordPropsToStudent');
    const timestampFromDate = firebase.firestore.Timestamp.fromDate(new Date(child.dob));
    sync({
      id: childRef.id,
      fatherEmail: record.fatherEmail,
      motherEmail: record.motherEmail,
      dob: timestampFromDate, // Using date: new date(child.dob) results in empty date property saved to db.
      fname: child.fname,
      gender: child.gender,
      grade: child.grade,
      lname: child.lname,
      race: child.race,
      recordId, // recordId: recordId shorthand.
    })
    .then((result) => {
      // console.log(`MD: RecordFormPage -> syncRecordPropsToStudent -> result`, result);
      this.firebaseService.studentsCollection.doc(childRef.id).ref.get()
      .then(doc => {
        if (doc.exists) {
        this.studentsAdded.push(doc.data());
        }
        // Refresh list with updated info.
        this.studentService.searchText$.next(this.studentService.searchTextValue);
      });
    });
    // .subscribe(x => console.log(`Returned from syncRecords cloud function: ${x}`));
  }

  private addSubCollectionsToStudent(childRef: any, recordId: any) {
    childRef.collection('attendance').doc(childRef.id).set({recordId}); // {recordId} is shorthand for {recordId: recordId}

    const timestampFromDate = firebase.firestore.Timestamp.fromDate(new Date());

    childRef.collection('financials').doc(childRef.id).set({recordId, dateCreated: timestampFromDate});
    this.financialCategories.forEach(cat => {
      childRef.collection('financials').doc(childRef.id).update({
        [cat.key + 'Balance']: 0,
      });
    });

    childRef.collection('grades').doc(childRef.id).set({recordId});
  }

// Cloud Firestore rules do not cascade to subcollections with this pattern:  https://youtu.be/eW5MdE3ZcAw?t=251
// To match a rule on a collection with every doc in subcollections within that collection: https://youtu.be/eW5MdE3ZcAw?t=350

// Sachin Shekhar  - In response to which data model is most optimal.
// None of them are optimal.. Learn to forget things from mysql world like normalization.
// In no-sql world, it's okay to keep data at two places (use cloud functions to keep them in sync).
// Define data models based on your app's need. Put a list in subcollection if you need to always fetch it
// together with a document*. You can also put small portion of data in the document itself if it makes queries fast.

// *This would most likely be the case with the top level students collection with subcollections of financials, grades, etc.

  private resetForm(formDirective?) {
    if (formDirective) { formDirective.resetForm(); }
    this.recordForm.reset();
    this.recordForm.setControl('children', this.fb.array([]));
    this.recordForm.setControl('fatherPhones', this.fb.array([]));
    this.recordForm.setControl('motherPhones', this.fb.array([]));
    this.dismiss();
  }

  dismiss() {
    // Using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data.
    // https://ionicframework.com/docs/api/modal
    this.modalController.dismiss({
      dismissed: true
    });
  }
}
