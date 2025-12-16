import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechInterfaceComponent } from './tech-interface.component';

describe('TechInterfaceComponent', () => {
  let component: TechInterfaceComponent;
  let fixture: ComponentFixture<TechInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechInterfaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
