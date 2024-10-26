import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDoctorRegistrationComponent } from './patient-doctor-registration.component';

describe('PatientDoctorRegistrationComponent', () => {
  let component: PatientDoctorRegistrationComponent;
  let fixture: ComponentFixture<PatientDoctorRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDoctorRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientDoctorRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
