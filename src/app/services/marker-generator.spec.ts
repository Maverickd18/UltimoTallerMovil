import { TestBed } from '@angular/core/testing';

import { MarkerGenerator } from './marker-generator';

describe('MarkerGenerator', () => {
  let service: MarkerGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkerGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
