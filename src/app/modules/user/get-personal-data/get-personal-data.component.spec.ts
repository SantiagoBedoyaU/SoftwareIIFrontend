import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetPersonalDataComponent } from './get-personal-data.component';

describe('GetPersonalDataComponent', () => {
  let component: GetPersonalDataComponent;
  let fixture: ComponentFixture<GetPersonalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetPersonalDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetPersonalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
