import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestDetailComponent } from './work-request-detail.component';

describe('WorkRequestDetailComponent', () => {
  let component: WorkRequestDetailComponent;
  let fixture: ComponentFixture<WorkRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
