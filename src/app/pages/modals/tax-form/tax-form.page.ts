import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-tax-form',
  templateUrl: './tax-form.page.html',
  styleUrls: ['./tax-form.page.scss'],
})
export class TaxFormPage implements OnInit, OnDestroy {

  currentFinancialDoc: any;
  taxYear: any;
  currentCategory: string;
  totalPaymentAmount: number;
  currentStudent: any;
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
        this.getTransactions(this.currentFinancialDoc, cat.key + 'Payments');
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
    this.totalPaymentAmount = 0;
    const date = new Date();
    this.taxYear = date.getFullYear() - 1;
    currentFinancialDoc.ref.collection(collection).get()
    .then(snapshot => {
      snapshot.forEach(item => {
        const itemDate = new Date(item.data().date.seconds * 1000);
        if (itemDate.getFullYear() === this.taxYear && item.data().taxDeductible) {
          this.totalPaymentAmount += item.data().amount;
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
