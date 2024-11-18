import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewHistoryComponent } from './add-new-history.component';

describe('AddNewHistoryComponent', () => {
  let component: AddNewHistoryComponent;
  let fixture: ComponentFixture<AddNewHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
