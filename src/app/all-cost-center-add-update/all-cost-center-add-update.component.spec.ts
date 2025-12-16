import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCostCenterAddUpdateComponent } from './all-cost-center-add-update.component';

describe('AllCostCenterAddUpdateComponent', () => {
  let component: AllCostCenterAddUpdateComponent;
  let fixture: ComponentFixture<AllCostCenterAddUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCostCenterAddUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllCostCenterAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
