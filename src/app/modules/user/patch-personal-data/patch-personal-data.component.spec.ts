import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatchPersonalDataComponent } from './patch-personal-data.component';

describe('PatchPersonalDataComponent', () => {
  let component: PatchPersonalDataComponent;
  let fixture: ComponentFixture<PatchPersonalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatchPersonalDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatchPersonalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
