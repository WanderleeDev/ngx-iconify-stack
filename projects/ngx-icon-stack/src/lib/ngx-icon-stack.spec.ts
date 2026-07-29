import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxIconStack } from './ngx-icon-stack';

describe('NgxIconStack', () => {
  let component: NgxIconStack;
  let fixture: ComponentFixture<NgxIconStack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxIconStack],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxIconStack);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
