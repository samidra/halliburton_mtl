import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskRequestDetailComponent } from './task-request-detail.component';

describe('TaskRequestDetailComponent', () => {
  let component: TaskRequestDetailComponent;
  let fixture: ComponentFixture<TaskRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
