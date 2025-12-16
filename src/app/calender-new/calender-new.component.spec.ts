import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderNewComponent } from './calender-new.component';

describe('CalenderNewComponent', () => {
  let component: CalenderNewComponent;
  let fixture: ComponentFixture<CalenderNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalenderNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
