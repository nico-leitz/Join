import { Location } from '@angular/common';
import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { Help } from './help';

/** Browser-location surface required by the component tests. */
interface LocationMock {
  back: Mock<() => void>;
}

/** Authentication surface required by the shared layout components. */
interface AuthServiceMock {
  currentUser: WritableSignal<null>;
  isAuthenticated: WritableSignal<boolean>;
  signOut: Mock<() => Promise<boolean>>;
}

let component: Help;
let fixture: ComponentFixture<Help>;
let mockLocation: LocationMock;
let mockAuthService: AuthServiceMock;

/**
 * Creates the browser-location mock used by the test module.
 * @returns A fresh browser-location mock.
 */
function createLocationMock(): LocationMock {
  return { back: vi.fn() };
}

/**
 * Creates the authentication mock used by the shared layout.
 * @returns A fresh authentication-service mock.
 */
function createAuthServiceMock(): AuthServiceMock {
  return {
    currentUser: signal(null),
    isAuthenticated: signal(true),
    signOut: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  };
}

/** Configures the standalone help-page testing module. */
async function configureTestBed(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [Help],
    providers: [
      provideRouter([]),
      { provide: Location, useValue: mockLocation },
      { provide: AuthService, useValue: mockAuthService },
    ],
  }).compileComponents();
}

/** Creates and renders a help-page fixture. */
async function setupComponent(): Promise<void> {
  mockLocation = createLocationMock();
  mockAuthService = createAuthServiceMock();
  await configureTestBed();
  fixture = TestBed.createComponent(Help);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies the rendered help-page title. */
function shouldRenderTitle(): void {
  const title = fixture.debugElement.query(By.css('.help-page__title'))
    .nativeElement as HTMLElement;
  expect(title.textContent?.trim()).toBe('Help');
}

/** Verifies programmatic backward navigation. */
function shouldNavigateBackProgrammatically(): void {
  component['goBack']();
  expect(mockLocation.back).toHaveBeenCalled();
}

/** Verifies backward navigation from the template button. */
function shouldNavigateBackFromButton(): void {
  const backButton = fixture.debugElement.query(By.css('.help-page__back'));
  backButton.triggerEventHandler('click', null);
  expect(mockLocation.back).toHaveBeenCalled();
}

/** Verifies the rendered informational section headings. */
function shouldRenderSectionHeadings(): void {
  const headings = fixture.debugElement.queryAll(By.css('.help-page__section h2'));
  const texts = headings.map((heading) => {
    return (heading.nativeElement as HTMLElement).textContent?.trim();
  });
  expect(texts).toEqual(['What is Join?', 'How to use it']);
}

/** Registers all help-page component tests. */
function registerHelpTests(): void {
  beforeEach(setupComponent);
  afterEach(() => vi.clearAllMocks());
  it('should create the component', shouldCreateComponent);
  it('should render the Help title', shouldRenderTitle);
  it('should call location.back when goBack is executed', shouldNavigateBackProgrammatically);
  it('should trigger goBack when the back button is clicked', shouldNavigateBackFromButton);
  it('should display the informational sections', shouldRenderSectionHeadings);
}

describe('Help Component', registerHelpTests);