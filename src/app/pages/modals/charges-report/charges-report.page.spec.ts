import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargesReportPage } from './charges-report.page';

describe('ChargesReportPage', () => {
  let component: ChargesReportPage;
  let fixture: ComponentFixture<ChargesReportPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChargesReportPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargesReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
