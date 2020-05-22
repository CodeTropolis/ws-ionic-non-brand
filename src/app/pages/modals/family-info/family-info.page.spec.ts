import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FamilyInfoPage } from './family-info.page';

describe('FamilyInfoPage', () => {
  let component: FamilyInfoPage;
  let fixture: ComponentFixture<FamilyInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FamilyInfoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FamilyInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
