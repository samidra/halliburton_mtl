import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetAccessComponent } from './get-access.component';

describe('GetAccessComponent', () => {
  let component: GetAccessComponent;
  let fixture: ComponentFixture<GetAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetAccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
