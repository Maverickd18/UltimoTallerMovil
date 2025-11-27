import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArViewerPage } from './ar-viewer.page';

describe('ArViewerPage', () => {
  let component: ArViewerPage;
  let fixture: ComponentFixture<ArViewerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ArViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
