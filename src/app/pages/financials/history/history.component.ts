import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { MatTableDataSource } from '@angular/material';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { ChargesReportPage } from '../../modals/charges-report/charges-report.page';
import { AuthService } from '../../../services/auth.service';
import * as moment from 'moment';
import { User } from '../../../../models/user';
import { Plugins } from '@capacitor/core';
import { QueryDocumentSnapshot } from '@google-cloud/firestore';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {

  currentFinancialDoc: AngularFirestoreDocument;
  currentFinancialData: any;
  transactions: any[] = [];
  subscriptions: any[] = [];
  displayedColumns: string[];
  dataSource: MatTableDataSource<any>;
  balanceKey: string;
  currentCategoryKey: string;
  isDeleting: boolean[] = [];
  confirmedDeletion: boolean[] = [];
  isEditing: boolean[] = [];
  currentCategoryValue: any;
  formGroup: FormGroup[] = [];
  formValue: any;
  currentStudent: any;
  selectedYearStart: any;
  selectedYearEnd: any;

  currentYYYYStart = moment().get('year');
  currentYYYYEnd = moment().get('year') + 1;
  startDayMonth = 'Aug-01';
  endDayMonth = 'Jun-15';

  currentSchoolYear = {start: moment(this.startDayMonth + '-' + this.currentYYYYStart, 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' + this.currentYYYYEnd, 'MMM-DD-YYYY')};

  year$ = new BehaviorSubject<any>(this.currentSchoolYear);
  yearSelect = new FormControl();
  selectedYear: moment.Moment;

  user: User;
  isWeb: boolean;

  private unsubscribe$ = new Subject();

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  years: any[] = [

    { start: moment(this.startDayMonth + '-' + '2018', 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' + '2024', 'MMM-DD-YYYY'), display: 'All' },

    { start: moment(this.startDayMonth + '-' + '2018', 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' +  '2019', 'MMM-DD-YYYY'), display: '2018-19' },

    { start: moment(this.startDayMonth + '-' + '2019', 'MMM-DD-YYYY'),
     end: moment(this.endDayMonth + '-' + '2020', 'MMM-DD-YYYY'), display: '2019-20' },

    { start: moment(this.startDayMonth + '-' + '2020', 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' + '2021', 'MMM-DD-YYYY'), display: '2020-21' },

    { start: moment(this.startDayMonth + '-' + '2021', 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' + '2022', 'MMM-DD-YYYY'), display: '2021-22' },

    { start: moment(this.startDayMonth + '-' + '2022', 'MMM-DD-YYYY'),
    end: moment(this.endDayMonth + '-' + '2023', 'MMM-DD-YYYY'), display: '2022-23' },

  ];

  transactionObj: {
    id: string; date: string; memo?: string; type: string; // shorthand for type: type
  };

  currentCategory2018StartingBalance: number;
  tuitionAssistanceAmount: number;
  tuitionChargeWithoutAssistance: any;

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private modalController: ModalController,
    private authService: AuthService) { }

  ngOnInit() {

    this.getDeviceInfo().then(info => {
      info.platform === 'web' ? this.isWeb = true : this.isWeb = false;
    });

    this.authService.user$
    .pipe(
      takeUntil(this.unsubscribe$),
      ).subscribe(user => {
      this.user = user;
      this.user.roles.admin ? this.displayedColumns = ['type', 'amount', 'date', 'memo', 'status', 'taxDeductible', 'actions'] :
      this.displayedColumns = ['type', 'amount', 'date', 'memo', 'status', 'taxDeductible'];
    });

    this.dataService.currentStudent$
    .pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(student => {
      this.currentStudent = student;
    });

    this.dataService.currentFinancialDoc$.pipe(
      takeUntil(this.unsubscribe$),
      switchMap((doc: AngularFirestoreDocument) => {
        this.currentFinancialDoc = doc;
        this.dataSource = null;
        return this.currentFinancialDoc.valueChanges();
      }),
    ).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(data => {
      this.currentFinancialData = data;
      if (this.currentCategoryKey) {
        // Update history upon changes to financial doc so that
        // when admin enters a payment, charge, or fee, history reflects it immediately.
        this.dataSource = null;
        this.transactions = [];
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Charges');
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Payments');
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Fees');
      }
    });

    // Get the data from the payments and charges subcollections based on currently selected category
    this.dataService.currentFinancialCategoryObj$.pipe(
        takeUntil(this.unsubscribe$),
        ).subscribe(cat => {
        if (cat) {
          // Hide tuition assistance when switching to a cat other than tuition.
          if (cat.key !== 'tuition') { this.tuitionAssistanceAmount = null; }
          // console.log(`MD: ngOnInit -> cat`, cat);
          this.currentCategoryKey = cat.key;
          this.currentCategoryValue = cat.value;
          this.balanceKey = cat.key + 'Balance';
          this.dataSource = null;
          this.transactions = [];
          // Getting collection keys from data service results in category being off...?
          // Update history when a different category is selected.
          this.getTransactions(this.currentFinancialDoc, cat.key + 'Charges');
          this.getTransactions(this.currentFinancialDoc, cat.key + 'Payments');
          this.getTransactions(this.currentFinancialDoc, cat.key + 'Fees');
          this.currentCategory2018StartingBalance = this.currentFinancialData[this.currentCategoryKey + '2018StartingBalance'];
          // this.scroll('data');
        } else {
          console.log('No category selected.');
        }
      });

    this.year$.next(this.years[0]); // This causes year selected to be 'All'

    this.year$.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(year => {
        this.selectedYear = year;
        this.selectedYearStart = year.start;
        this.selectedYearEnd = year.end;
        this.dataSource = null;
        this.transactions = [];
        this.getTransactions(this.currentFinancialDoc,  this.currentCategoryKey + 'Charges');
        this.getTransactions(this.currentFinancialDoc,  this.currentCategoryKey + 'Payments');
        this.getTransactions(this.currentFinancialDoc,  this.currentCategoryKey + 'Fees');

        if (this.currentFinancialData && this.currentCategoryKey === 'tuition') {
          this.currentFinancialDoc.ref.collection('tuitionAssistance')
            .where('date', '>', new Date(this.selectedYearStart.format('MMM-DD-YYYY')))
            .where('date', '<', new Date(this.selectedYearEnd.format('MMM-DD-YYYY')))
            .get().then(querySnapshot => {
              if (!querySnapshot.empty) {
                querySnapshot.forEach(doc => {
                  this.tuitionAssistanceAmount = doc.data().amount;
                  this.tuitionChargeWithoutAssistance = this.currentFinancialData.tuitionBalance + this.tuitionAssistanceAmount;
                });
              }
            });
        } else { this.tuitionAssistanceAmount = null; }

      });
  }

  async getDeviceInfo() {
    const { Device } = Plugins;
    return await Device.getInfo();
  }

  selectYear(year) {
    this.year$.next(year);
  }

  // This should only fire 3 times per category selection.
  private getTransactions(currentFinancialDoc: AngularFirestoreDocument, collection: string) {
    let type = '';
    if (collection.includes('Charges')) { type = 'Charge'; }
    if (collection.includes('Fees')) { type = 'Fee'; }
    if (collection.includes('Payment')) { type = 'Payment'; }
    currentFinancialDoc.ref.collection(collection).get()
    .then(snapshot => {
      snapshot.forEach(item => {
        const date = moment(item.data().date.seconds * 1000).format('L');
        // this.tuitionChargeWithoutAssistance = item.data().chargeWithoutAssistance;
        // this.currentFinancialDoc.collection('tuitionAssistance', ref => ref.where('year', '==', moment().year()))
        // .valueChanges().subscribe(doc => console.log(doc));
        this.transactionObj = {
          ...item.data(),
          id: item.id,
          date,
          type
        };
        if (moment(item.data().date.seconds * 1000).isBetween(this.selectedYearStart, this.selectedYearEnd)) {
          this.transactions.push(this.transactionObj);
        }
        this.dataSource = new MatTableDataSource(this.transactions);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }

  editTransaction(row) {
    this.isEditing[row.id] = true;
    const fDate = new Date(row.date);
    this.formGroup[row.id] = this.fb.group({
      amount: [row.amount, Validators.required],
      date: [fDate, Validators.required],
      memo: [row.memo, Validators.required],
      taxDeductible: [row.taxDeductible],
      chargePaid: [row.chargePaid]
    });
  }

  save(row) {
    const existingAmount = row.amount;
    const currentBalance = this.currentFinancialData[this.balanceKey];
    let updatedBalance: number;
    let collection = '';
    this.formValue = this.formGroup[row.id].value;
    // const memoAsString = this.formValue.memo.toString();
    // console.log(`MD: save -> memoAsString`, memoAsString);

    if (row.type.includes('Charge')) { collection = this.currentCategoryKey + 'Charges'; }
    if (row.type.includes('Fee')) { collection = this.currentCategoryKey + 'Fees'; }
    if (row.type.includes('Payment')) { collection = this.currentCategoryKey + 'Payments'; }

    // Update the payment, fee, or charge entry
    this.currentFinancialDoc.ref.collection(collection).doc(row.id)
      .set({amount: this.formValue.amount,
            date: this.formValue.date,
             // Upon save, any memo that is 'Due MM/DD/YYYY'
             // is getting saved as Due: Day Month DD YYYY GMT-0500 which results in invalid date
            memo: this.formValue.memo,
            taxDeductible: this.formValue.taxDeductible,
            chargePaid: this.formValue.chargePaid,
            }, { merge: true })
      .then(() => {
        // Update the balance
        // Get the difference between the existing payment or change and that of the
        // form value and apply it to balance accordingly.
        const difference = existingAmount - this.formValue.amount;
        row.type === 'Payment' ? (updatedBalance = currentBalance + difference) : updatedBalance = currentBalance - difference;
       // Update the balance in the DB:
        this.currentFinancialDoc.ref
        .set({ [this.balanceKey]: updatedBalance }, { merge: true })
          .then( () => {
            // Update history
            this.transactions = [];
            this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Charges');
            this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Payments');
            this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Fees');
          });
        // Take user out of editing mode.
        this.isEditing[row.id] = false;
      });
  }


  deleteTransaction(id: string, type: string, amount: number) {

    this.confirmedDeletion[id] = true;

    let collection = '';

    if (type.includes('Charge')) { collection = this.currentCategoryKey + 'Charges'; }
    if (type.includes('Fee')) { collection = this.currentCategoryKey + 'Fees'; }
    if (type.includes('Payment')) { collection = this.currentCategoryKey + 'Payments'; }

    const currentBalance = this.currentFinancialData[this.balanceKey];
    let updatedBalance: number;
    type.includes('Payment') ?
    updatedBalance = currentBalance + amount :
    updatedBalance = currentBalance - amount; // For charges and fees

    this.currentFinancialDoc.ref.update({[this.balanceKey]: updatedBalance})
    .then(() => {
      this.currentFinancialDoc.ref
      .collection(collection)
      .doc(id)
      .delete()
      .then( x => {
        this.transactions = [];
        this.dataSource = null;
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Charges');
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Payments');
        this.getTransactions(this.currentFinancialDoc, this.currentCategoryKey + 'Fees');
      });
    });

  }

  async presentChargesReportModal() {
    const modal = await this.modalController.create({
      component:  ChargesReportPage,
      cssClass: 'charges-report-modal' // Must be defined in global.scss
    });
    return await modal.present();
  }

  // scroll(el: string) {
  //   const element = document.getElementById(el);
  //   console.log(`MD: scroll -> element`, element);
  //   if (element) {
  //     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  // }
  // Do not use Ionic's ionViewDidLeave lifecycle hook here.
  // History is a child in financials component.
  // It is the financials component we nav away from therefore
  // ionViewDidLeave will not fire for this component.
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
