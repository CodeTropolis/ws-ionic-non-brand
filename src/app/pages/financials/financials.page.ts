import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../services/data.service';
import { switchMap, tap, take, takeUntil } from 'rxjs/operators';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, zip, Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TaxFormPage } from '../modals/tax-form/tax-form.page';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/user';
import { Plugins } from '@capacitor/core';

import { Platform } from '@ionic/angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { FamilyInfoPage } from '../modals/family-info/family-info.page';
import { RecordFormPage } from '../modals/record-form/record-form.page';
import * as moment from 'moment';


@Component({
  selector: 'app-financials',
  templateUrl: './financials.page.html',
  styleUrls: ['./financials.page.scss'],
})
export class FinancialsPage implements OnInit, OnDestroy {

  private chargesSubcollection: string;
  private paymentsSubcollection: string;
  private feesSubcollection: string;
  private balanceKey: string;

  currentStudent: any;
  currentFinancialDoc: any;
  currentFinancialData: any;
  formGroup: FormGroup;
  formValue: any;
  categories: any[] = [];
  currentCategoryObj: any;
  showForm: boolean;
  isEnteringPayment = false;
  isEnteringCharge = false;
  isEnteringFee = false;
  balance$ = new BehaviorSubject<number>(null);
  disableSubmitButton: boolean;
  studentsOfRecord$: Observable<any>;
  currentRecordId: string;
  user: User;
  isWeb: boolean;

  tuitionAssistanceChecked: boolean;
  tuitionAmountWithoutAssistance: number;
  private unsubscribe$ = new Subject();


  constructor(
    private dataService: DataService,
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private modalController: ModalController,
    private authService: AuthService,
    private screenOrientation: ScreenOrientation,
    public platform: Platform) { }

   ngOnInit() { // Gets called each time the page is loaded.

    if (this.platform.is('capacitor')) {
      this.platform.ready().then(() => {
        console.log('Screen orientation: ', this.screenOrientation.type); // logs the current orientation, example: 'landscape'
        console.log('rotating device to landscape');
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
      });
    }

    this.getDeviceInfo().then(x => {
      // console.log(x);
      // info.platform === 'web' ? this.isWeb = true : this.isWeb = false;
      // console.log(`MD: getDeviceInfo -> this.isWeb `, this.isWeb );
      // console.log(info);
    });

    this.dataService.currentFinancialCategoryObj$.next(null);

  // --------- Testing -------------------------------
    const testStudent = {
      fname: 'David',
      lname: 'Test',
      id: 'i3uffgRn5hZyWNwDPTuH',
      recordId: 'nBdLtZRj5d9ns7XUUogA'
    };
    // this.dataService.setStudent(testStudent);
  // ---------------------------------------------------

    this.authService.user$
    .pipe(
      take(1),
      ).subscribe(user => {
      this.user = user;
    });

  // Listen for student change either from student.page or student select drop down on this component.

    this.dataService.currentStudent$.pipe(
        switchMap(student => {
        this.currentStudent = student;
        this.currentRecordId = student.recordId; // For getting studentsOfRecord.
        // Get the financial doc of the current student
        this.currentFinancialDoc = this.afs.collection('students').doc(student.id).collection('financials').doc(student.id);
        this.dataService.currentFinancialDoc$.next(this.currentFinancialDoc); // for history
        return this.currentFinancialDoc.valueChanges();
      })
    ).pipe(
      takeUntil(this.unsubscribe$),
      ).subscribe(data => {
      this.currentFinancialData = data;
      this.dataService.balance$.next(this.currentFinancialData[this.balanceKey]);
    });

    // Admin needs ability to select other students of record without returning to student search so
    // get other students which are referenced to the recordId
    this.studentsOfRecord$ = this.afs.collection('students',
    ref => ref.where('recordId', '==', this.currentRecordId)).valueChanges({idField: 'id'});

    this.setFormControls();
    this.categories = this.dataService.financialCategories;
  }

  async getDeviceInfo() {
    const { Device } = Plugins;
    return await Device.getInfo();
  }

  setCategoryAndGetCategoryBalance(cat) {
    this.showForm = false;
    this.dataService.currentFinancialCategoryObj$.next(cat); // Also for other components i.e. History.
    this.currentCategoryObj = cat; // For template.
    this.balanceKey = cat.key + 'Balance'; // Do not change key strings.  Keys already present in DB.
    this.chargesSubcollection = cat.key + 'Charges';
    this.paymentsSubcollection = cat.key + 'Payments';
    this.feesSubcollection = cat.key + 'Fees';
    this.dataService.balance$.next(this.currentFinancialData[this.balanceKey]);
    this.balance$ = this.dataService.balance$;
    this.scroll('history');
  }

  private setFormControls() {
    this.formGroup = this.fb.group({
      taxDeductionEligible: [''],
      amount: ['', Validators.required],
      date: ['', Validators.required],
      memo: ['', Validators.required],
      taxDeductible: [''],
      tuitionAssistance: this.fb.array([]),
    });
  }

  private resetForm(formDirective?) {
    if (formDirective) {
      formDirective.resetForm();
    }
    this.formGroup.reset();
  }

  enterPayment() {
    this.isEnteringPayment = true;
    this.isEnteringCharge = false;
    this.isEnteringFee = false;
    this.showForm = true;
    this.resetForm();
  }

  enterCharge() {
    this.isEnteringPayment = false;
    this.isEnteringCharge = true;
    this.isEnteringFee = false;
    this.showForm = true;
    this.resetForm();
  }

  enterFee() {
    this.isEnteringPayment = false;
    this.isEnteringCharge = false;
    this.isEnteringFee = true;
    this.showForm = true;
    this.resetForm();
  }


  get tuitionAssistanceForm() {
    return this.formGroup.get('tuitionAssistance') as FormArray;
  }

  addTuitionAssistanceForm(e) {
    if (e.checked) {
      this.tuitionAssistanceChecked = true;
      const ta = this.fb.group({
        number: [],
      });
      this.tuitionAssistanceForm.push(ta);
    } else {
      this.tuitionAssistanceChecked = false;
      if (this.tuitionAssistanceForm.length > 0) {
        this.tuitionAssistanceForm.removeAt(0);
      }
    }
  }

  submitHandler(formDirective) {
    let promise;
    this.disableSubmitButton = true;
    let subcollection;
    let actualTuitionAmount;
    this.formValue = this.formGroup.value;
    if (this.isEnteringCharge) { subcollection = this.chargesSubcollection; }
    if (this.isEnteringPayment) { subcollection = this.paymentsSubcollection; }
    if (this.isEnteringFee) { subcollection = this.feesSubcollection; }

    if (subcollection === 'tuitionCharges') {
      if (this.tuitionAssistanceChecked) {
        const tuitionAssistanceAmount: number = this.formValue.tuitionAssistance[0].number;
        actualTuitionAmount = this.formValue.amount - tuitionAssistanceAmount;
        this.tuitionAmountWithoutAssistance = this.formValue.amount;
        // Tuition Assistance as subcollection to allow for easier querying on year select on history.component.
        this.currentFinancialDoc.ref.collection('tuitionAssistance').doc().set({
          date: this.formValue.date,
          amount: tuitionAssistanceAmount,
          year: moment(this.formValue.date).year()
        });
      } else {
        actualTuitionAmount = this.formValue.amount;
        this.tuitionAmountWithoutAssistance = null;
      }
      // Split into 10 charges.
      const charge: number = actualTuitionAmount / 10;
      const chargeWithoutAssistance = this.tuitionAmountWithoutAssistance / 10;
      const d = new Date();
      for (let index = 0; index < 10; index++) {
        const incremMonth =  moment(d).add(index + 1, 'months');
        const dueDate =  incremMonth.toDate().toLocaleDateString('en-US');
        promise = this.currentFinancialDoc.ref.collection(subcollection).doc().set({
          amount: charge,
          chargeWithoutAssistance,
          date: new Date(dueDate), // Material table needs date object.  Date as string will cause row to not display
          memo: `Due: ${dueDate} `,
        });
      }
    } else {
        promise = this.currentFinancialDoc.ref.collection(subcollection).doc()
        .set({
          amount: this.formValue.amount,
          date: this.formValue.date,
          memo: this.formValue.memo,
          taxDeductible: this.formValue.taxDeductionEligible,
        });
      }
    promise.then(() => {
        let currentBalance: number;
        // Data from previous version may not have a balance key.
        this.currentFinancialData[this.balanceKey] ? currentBalance = this.currentFinancialData[this.balanceKey] : currentBalance = 0;
        let updatedRunningBalance: number;
        if (this.tuitionAssistanceChecked && subcollection === 'tuitionCharges') {
          updatedRunningBalance = currentBalance + actualTuitionAmount;
          this.currentFinancialDoc.ref.update({[this.balanceKey]: updatedRunningBalance})
          .then(() => {
            this.resetForm(formDirective);
            this.disableSubmitButton = false;
          });
        } else {
          this.isEnteringPayment ?
          updatedRunningBalance = currentBalance - this.formValue.amount :
          updatedRunningBalance = currentBalance + this.formValue.amount; // For charges and fees
          this.currentFinancialDoc.ref.update({[this.balanceKey]: updatedRunningBalance})
          .then(() => {
            this.resetForm(formDirective);
            this.disableSubmitButton = false;
          });
        }

      });
  }

  selectStudent(student) {
    this.dataService.currentStudent$.next(student);
    this.showForm = false;
  }

  async presentTaxFormModal() {
    const modal = await this.modalController.create({
      component:  TaxFormPage,
      cssClass: 'tax-form-modal' // Must be defined in global.scss
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

  async presentRecordFormModal(isUpdating: boolean) {
    isUpdating ? this.dataService.isUpdatingRecord$.next(true) : this.dataService.isUpdatingRecord$.next(false);
    const modal = await this.modalController.create({
      component:  RecordFormPage,
      cssClass: 'record-form-modal' // Must be defined in global.scss
    });
    return await modal.present();
  }

  // ToDo: History needs to alert a service when the data has loaded versus using timeout
  // Else app-history doesn't have the proper dimension for scrollIntoView to work properly.
  scroll(el: string) {
    const element = document.getElementById(el);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }

  goToURL(url) {
    window.open(url, '_blank');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // ionViewDidLeave() {
  //   this.subscriptions.forEach(sub => {
  //     sub.unsubscribe();
  //   });
  // }
}
