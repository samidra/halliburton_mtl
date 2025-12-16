import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderFoorterComponent } from './header-foorter.component';

describe('HeaderFoorterComponent', () => {
  let component: HeaderFoorterComponent;
  let fixture: ComponentFixture<HeaderFoorterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderFoorterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderFoorterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
