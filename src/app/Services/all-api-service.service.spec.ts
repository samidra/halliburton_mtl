import { TestBed } from '@angular/core/testing';

import { AllApiServiceService } from './all-api-service.service';

describe('AllApiServiceService', () => {
  let service: AllApiServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllApiServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
