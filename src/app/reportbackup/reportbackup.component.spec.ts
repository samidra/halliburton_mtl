import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportbackupComponent } from './reportbackup.component';

describe('ReportbackupComponent', () => {
  let component: ReportbackupComponent;
  let fixture: ComponentFixture<ReportbackupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportbackupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportbackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
