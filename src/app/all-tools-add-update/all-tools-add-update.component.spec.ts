import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllToolsAddUpdateComponent } from './all-tools-add-update.component';

describe('AllToolsAddUpdateComponent', () => {
  let component: AllToolsAddUpdateComponent;
  let fixture: ComponentFixture<AllToolsAddUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllToolsAddUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllToolsAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
