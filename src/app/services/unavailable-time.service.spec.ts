import { TestBed } from '@angular/core/testing';

import { UnavailableTimeService } from './unavailable-time.service';

describe('UnavailableTimeService', () => {
  let service: UnavailableTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnavailableTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
