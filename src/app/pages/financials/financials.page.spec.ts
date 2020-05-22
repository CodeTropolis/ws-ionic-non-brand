import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialsPage } from './financials.page';

describe('FinancialsPage', () => {
  let component: FinancialsPage;
  let fixture: ComponentFixture<FinancialsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinancialsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinancialsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
