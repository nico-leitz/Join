import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { LegalNotice } from './legal-notice';
import { AuthService } from '../../../core/services/auth.service';

/**
 * @description Unit tests for the LegalNotice component.
 * Verifies static content rendering, DOM structure, and the integration
 * of the Angular Location service for backwards navigation.
 */
describe('LegalNotice Component', () => {
  let component: LegalNotice;
  let fixture: ComponentFixture<LegalNotice>;
  let mockLocation: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockLocation = {
      back: vi.fn()
    };

    /** Mocking AuthService to satisfy dependency requirements of the nested Header and Sidebar components. */
    mockAuthService = {
      currentUser: signal(null),
      isAuthenticated: vi.fn().mockReturnValue(true),
      logOut: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LegalNotice],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: mockLocation },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNotice);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test Ensures the component creates successfully.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that the hero title is rendered correctly in the DOM.
   */
  it('should render the Legal Notice title', () => {
    const titleElement = fixture.debugElement.query(By.css('.legal-notice-page__title')).nativeElement;
    
    expect(titleElement.textContent.trim()).toBe('Legal Notice');
  });

  /**
   * @test Verifies that the programmatic navigation method triggers the Location service correctly.
   */
  it('should call location.back when goBack is executed programmatically', () => {
    /** Accessing protected method via bracket notation for testing purposes. */
    component['goBack']();
    
    expect(mockLocation.back).toHaveBeenCalled();
  });

  /**
   * @test Ensures that the UI back button is properly bound and triggers the location back navigation.
   */
  it('should trigger goBack when the back button is clicked in the template', () => {
    const backButton = fixture.debugElement.query(By.css('.legal-notice-page__back'));
    backButton.triggerEventHandler('click', null);

    expect(mockLocation.back).toHaveBeenCalled();
  });

  /**
   * @test Verifies that key informational sections and their headings are present in the DOM.
   */
  it('should display the "Imprint" and "Exploring the Board" sections', () => {
    const sectionHeaders = fixture.debugElement.queryAll(By.css('.legal-notice-page__section h2'));
    
    expect(sectionHeaders.length).toBe(2);
    expect(sectionHeaders[0].nativeElement.textContent.trim()).toBe('Imprint');
    expect(sectionHeaders[1].nativeElement.textContent.trim()).toBe('Exploring the Board');
  });
});