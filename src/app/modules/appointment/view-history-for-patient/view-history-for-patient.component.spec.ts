import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewHistoryForPatientComponent } from './view-history-for-patient.component';

describe('ViewHistoryForPatientComponent', () => {
  let component: ViewHistoryForPatientComponent;
  let fixture: ComponentFixture<ViewHistoryForPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewHistoryForPatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewHistoryForPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
