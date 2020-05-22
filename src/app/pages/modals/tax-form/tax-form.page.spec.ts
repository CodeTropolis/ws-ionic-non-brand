import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxFormPage } from './tax-form.page';

describe('TaxFormPage', () => {
  let component: TaxFormPage;
  let fixture: ComponentFixture<TaxFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
