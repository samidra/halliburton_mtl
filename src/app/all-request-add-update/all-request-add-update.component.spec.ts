import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRequestAddUpdateComponent } from './all-request-add-update.component';

describe('AllRequestAddUpdateComponent', () => {
  let component: AllRequestAddUpdateComponent;
  let fixture: ComponentFixture<AllRequestAddUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllRequestAddUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllRequestAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
