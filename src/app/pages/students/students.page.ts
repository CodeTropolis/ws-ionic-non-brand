import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModalController, IonInput } from '@ionic/angular';
import { RecordFormPage } from '../modals/record-form/record-form.page';
import { StudentService } from './students.service';
import { Observable, of} from 'rxjs';
import { debounceTime, switchMap} from 'rxjs/operators';
import { Router } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/user';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { FamilyInfoPage } from '../modals/family-info/family-info.page';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
})
export class StudentsPage implements OnInit, OnDestroy {

  private subscriptions: any[] = [];

  students$: Observable<any[]> = new Observable();
  displayedColumns: string[] = ['fname', 'lname', 'grade', 'active', 'actions'];
  dataSource: MatTableDataSource<any> = null;
  user: User;
  isEditing: boolean[] = [];
  formGroup: FormGroup[] = [];
  formValue: any;
  currentStudent: any;
  studentsAdded: any[] = [];
  searchTextValue: string = null;
  didProcessData = false;
  dataPositive = false;
  showNotice = false;
  results$: Observable<any[]> = new Observable();
  searchedWithoutResults = false;

  constructor(
    private dataService: DataService,
    public modalController: ModalController,
    public studentService: StudentService,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private firebaseService: FirebaseService
    ) {  }

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  ngOnInit() {}

  ionViewDidEnter() {

   this.authService.user$
    .pipe(switchMap(user => {
      this.user = user;
      if (user && !user.roles.admin) {
        return this.studentService.getRecordsByEmail(user.email);
      } else { return of(''); } // prevent undefined
    }))
    .subscribe(data => {
      if (data && data.length > 0) {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        } else {
          this.dataSource = null;
        }
      },
      (error: any) => console.error(error),
      () => {
        console.log('get records observable complete');
      }
    );

    // this.dataService.currentFinancialDoc$.next(null); will cause History's switchMap to yield null error despite unsubscribing
    // [Perhaps a race condition as pointed out buy Dorus @ https://gitter.im/Reactive-Extensions/RxJS]

    // this.studentService.searchText$.next(null); // So that a query is not executed when returning to component

   this.studentService.searchText$
    .pipe(
      debounceTime(500),
      switchMap(term => {
        // console.log(`MD: term`, term);
        if (term) {
          this.studentService.searchTextValue = term;
          this.searchTextValue = term;
          return this.studentService.getRecordsBySearch(term);
        } else {
          this.searchTextValue = '';
          return of('');
        }
      })
    )
    .subscribe(data => {
      if (data && data.length > 0) {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.searchedWithoutResults = false;
        } else {
          this.dataSource = null;
          this.searchedWithoutResults = true;
        }
      },
      (error: any) => console.error(error),
      () => {
        console.log('get records observable complete');
      }
    );

   this.subscriptions.push(
      this.dataService.currentStudent$.subscribe(student => {
        this.currentStudent = student;
      })
    );
  }

  search(searchText) {
    this.searchedWithoutResults = false;
    this.studentService.searchTextValue = searchText;
    this.studentService.searchText$.next(searchText);
  }

  async presentRecordFormModal(isUpdating: boolean) {
    isUpdating ? this.dataService.isUpdatingRecord$.next(true) : this.dataService.isUpdatingRecord$.next(false);
    const modal = await this.modalController.create({
      component:  RecordFormPage,
      cssClass: 'record-form-modal' // Must be defined in global.scss
    });
    return await modal.present();
  }

  async presentFamilyInfoModal() {
    const modal = await this.modalController.create({
      component:  FamilyInfoPage,
      cssClass: 'family-info-modal' // Must be defined in global.scss
    });
    return await modal.present();
  }

  setStudent(student) {
    this.dataService.setStudent(student);
  }

  public goTo(route: string) {
    this.router.navigate([route]);
  }

  editStudent(row) {
    this.isEditing[row.id] = true;
    this.formGroup[row.id] = this.fb.group({
      fname: [row.fname],
      lname: [row.lname],
      grade: [row.grade],
      active: [row.active]
    });
  }

  saveStudent(row) {
    this.formValue = this.formGroup[row.id].value;
    this.firebaseService.studentsCollection.doc(this.currentStudent.id)
      .update(
        {fname: this.formValue.fname,
        lname: this.formValue.lname,
        grade: this.formValue.grade,
        active: this.formValue.active}
        )
      .then(() => {
        this.isEditing[row.id] = false;
        // Refresh the page with updated data by running the search.
        this.studentService.searchText$.next(this.studentService.searchTextValue);
      });
  }

  cancelEdit(row) {
    this.isEditing[row.id] = false;
  }

  logOut() {
    this.authService.logOut();
    this.router.navigate(['login']);
  }

  ionViewDidLeave() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  ngOnDestroy() {
  }

}
