import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultHoursComponent } from './consult-hours.component';

describe('ConsultHoursComponent', () => {
  let component: ConsultHoursComponent;
  let fixture: ComponentFixture<ConsultHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultHoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
