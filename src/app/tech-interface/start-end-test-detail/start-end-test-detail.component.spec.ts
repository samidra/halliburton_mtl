import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartEndTestDetailComponent } from './start-end-test-detail.component';

describe('StartEndTestDetailComponent', () => {
  let component: StartEndTestDetailComponent;
  let fixture: ComponentFixture<StartEndTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartEndTestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartEndTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
