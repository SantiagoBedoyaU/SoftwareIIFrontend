import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewHistoryForPhysicianComponent } from './view-history-for-physician.component';

describe('ViewHistoryForPhysicianComponent', () => {
  let component: ViewHistoryForPhysicianComponent;
  let fixture: ComponentFixture<ViewHistoryForPhysicianComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewHistoryForPhysicianComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewHistoryForPhysicianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
