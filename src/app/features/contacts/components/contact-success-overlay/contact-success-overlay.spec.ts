import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContactSuccessOverlay } from './contact-success-overlay';

let component: ContactSuccessOverlay;
let fixture: ComponentFixture<ContactSuccessOverlay>;

/** Configures the standalone success-overlay testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ContactSuccessOverlay],
  }).compileComponents();
}

/** Creates a rendered success-overlay fixture with its required input. */
async function setupComponent(): Promise<void> {
  await configureTestBed();
  fixture = TestBed.createComponent(ContactSuccessOverlay);
  component = fixture.componentInstance;
  fixture.componentRef.setInput('message', 'Contact successfully created');
  fixture.detectChanges();
}

/**
 * Returns the rendered overlay element.
 * @returns The rendered overlay element.
 */
function getOverlayElement(): HTMLElement {
  return fixture.debugElement.query(By.css('.contact-success-overlay')).nativeElement;
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies rendering of the provided message input. */
function shouldDisplayProvidedMessage(): void {
  expect(getOverlayElement().textContent?.trim()).toBe('Contact successfully created');
}

/** Verifies reactive rendering after the message input changes. */
function shouldUpdateDisplayedMessage(): void {
  fixture.componentRef.setInput('message', 'Another success message');
  fixture.detectChanges();
  expect(getOverlayElement().textContent?.trim()).toBe('Another success message');
}

/** Registers all success-overlay component tests. */
function registerContactSuccessOverlayTests(): void {
  beforeEach(setupComponent);
  it('should create the component', shouldCreateComponent);
  it('should display the provided message in the overlay', shouldDisplayProvidedMessage);
  it(
    'should update the displayed text when the message input changes',
    shouldUpdateDisplayedMessage,
  );
}

describe('ContactSuccessOverlay Component', registerContactSuccessOverlayTests);