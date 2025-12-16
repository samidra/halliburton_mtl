import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFacilityAddUpdateComponent } from './all-facility-add-update.component';

describe('AllFacilityAddUpdateComponent', () => {
  let component: AllFacilityAddUpdateComponent;
  let fixture: ComponentFixture<AllFacilityAddUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFacilityAddUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllFacilityAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
