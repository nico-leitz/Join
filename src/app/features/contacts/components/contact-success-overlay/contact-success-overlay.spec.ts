import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ContactSuccessOverlay } from './contact-success-overlay';
import { By } from '@angular/platform-browser';

/**
 * @description Unit tests for the ContactSuccessOverlay component.
 * This suite verifies that the component correctly initializes and 
 * displays the required message input in the DOM.
 */
describe('ContactSuccessOverlay Component', () => {
  let component: ContactSuccessOverlay;
  let fixture: ComponentFixture<ContactSuccessOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactSuccessOverlay],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactSuccessOverlay);
    component = fixture.componentInstance;

    // A required input must be set before the first detectChanges() call.
    fixture.componentRef.setInput('message', 'Contact successfully created');
    fixture.detectChanges();
  });

  /**
   * @test Ensures the component creates successfully with the required input.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that the provided message input is correctly rendered in the template.
   */
  it('should display the provided message in the overlay', () => {
    const overlayElement = fixture.debugElement.query(By.css('.contact-success-overlay')).nativeElement;
    
    expect(overlayElement.textContent.trim()).toBe('Contact successfully created');
  });

  /**
   * @test Ensures the template updates reactively when the input signal changes.
   */
  it('should update the displayed text when the message input changes', () => {
    fixture.componentRef.setInput('message', 'Another success message');
    fixture.detectChanges();

    const overlayElement = fixture.debugElement.query(By.css('.contact-success-overlay')).nativeElement;
    
    expect(overlayElement.textContent.trim()).toBe('Another success message');
  });
});