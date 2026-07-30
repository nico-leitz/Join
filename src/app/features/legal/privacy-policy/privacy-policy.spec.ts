/**
 * @fileoverview Unit tests for the PrivacyPolicy component.
 * Verifies that the correct localized static texts and structural sections are rendered.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { PrivacyPolicy } from './privacy-policy';

/**
 * @description Test suite for the PrivacyPolicy Component.
 */
describe('PrivacyPolicy Component', () => {
  let component: PrivacyPolicy;
  let fixture: ComponentFixture<PrivacyPolicy>;

  /**
   * @description Sets up the test environment and compiles the component.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicy],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * @test Ensures the component creates successfully.
   */
  it('should create the PrivacyPolicy component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that the component renders the localized title "Datenschutzerklärung".
   */
  it('should render the Privacy Policy title', () => {
    const titleElement = fixture.debugElement.query(By.css('.privacy-policy-page__title')).nativeElement;
    expect(titleElement.textContent.trim()).toBe('Datenschutzerklärung');
  });

  /**
   * @test Checks if all eight structural Subtitle sections are displayed correctly.
   */
  it('should display the correct number of Subtitle sections', () => {
    const sectionHeaders = fixture.debugElement.queryAll(By.css('.privacy-policy-page__section h2'));
    expect(sectionHeaders.length).toBe(8);
  });
});