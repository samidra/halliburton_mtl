import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SucessSnackbarComponent } from './sucess-snackbar.component';

describe('SucessSnackbarComponent', () => {
  let component: SucessSnackbarComponent;
  let fixture: ComponentFixture<SucessSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SucessSnackbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SucessSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
