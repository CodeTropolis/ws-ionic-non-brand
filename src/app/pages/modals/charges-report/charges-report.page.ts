import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-charges-report',
  templateUrl: './charges-report.page.html',
  styleUrls: ['./charges-report.page.scss'],
})
export class ChargesReportPage implements OnInit, OnDestroy {

  currentFinancialDoc: any;
  taxYear: any;
  currentCategory: string;
  totalChargesDue: number;
  currentStudent: any;
  // Do not use 'charges' as the array property. Angular thinks charges as an array is an object and will not iterate..?
  unPaidCharges: any[] = [];
  private unsubscribe$ = new Subject();

  constructor(private dataService: DataService, private modalController: ModalController) { }

  ngOnInit() {
    this.dataService.currentFinancialDoc$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(data => this.currentFinancialDoc = data);

    this.dataService.currentFinancialCategoryObj$.pipe(
      takeUntil(this.unsubscribe$),
      ).subscribe(cat => {
      if (cat) {
        this.currentCategory = cat.value;
        this.getTransactions(this.currentFinancialDoc, cat.key + 'Charges');
        this.getTransactions(this.currentFinancialDoc, cat.key + 'Fees');
      } else {
        console.log('No category selected.');
      }
    });

    this.dataService.currentStudent$.pipe(
      takeUntil(this.unsubscribe$,
      )
    ).subscribe(student => this.currentStudent = student);
  }

  private getTransactions(currentFinancialDoc: AngularFirestoreDocument, collection: string) {
    this.unPaidCharges = [];
    this.totalChargesDue = 0;
    // const date = new Date();
    // this.taxYear = date.getFullYear() - 1;
    currentFinancialDoc.ref.collection(collection).get()
    .then(snapshot => {
      snapshot.forEach(item => {
        const itemDate = new Date(item.data().date.seconds * 1000);
        const chargeObj = {
          ...item.data(),
          date: itemDate,
          };
        if (!item.data().chargePaid) {
          this.unPaidCharges.push(chargeObj);
          this.totalChargesDue += item.data().amount;
        }
      });
    });
  }

  print() {
    window.print();
  }

  dismiss() {
    // Using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data.
    // https://ionicframework.com/docs/api/modal
    this.modalController.dismiss({
      dismissed: true
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
