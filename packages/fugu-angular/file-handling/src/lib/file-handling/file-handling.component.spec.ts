import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileHandlingComponent } from './file-handling.component';

describe('FileHandlingComponent', () => {
  let component: FileHandlingComponent;
  let fixture: ComponentFixture<FileHandlingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileHandlingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileHandlingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
