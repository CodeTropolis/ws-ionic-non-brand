import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { take } from 'rxjs/operators';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-family-info',
  templateUrl: './family-info.page.html',
  styleUrls: ['./family-info.page.scss'],
})
export class FamilyInfoPage implements OnInit {

  record: any;

  constructor(private dataService: DataService,  private firebaseService: FirebaseService) { }

  ngOnInit() {

    this.dataService.currentStudent$
    .pipe(
      take(1)
      )
    .subscribe(student => {
      this.firebaseService.recordsCollection.doc(student.recordId).ref.get().then(record => {
      this.record = record.data();
      });
    });
  }

}
