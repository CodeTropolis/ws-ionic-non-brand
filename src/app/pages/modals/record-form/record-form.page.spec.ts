import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordFormPage } from './record-form.page';

describe('RecordFormPage', () => {
  let component: RecordFormPage;
  let fixture: ComponentFixture<RecordFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
