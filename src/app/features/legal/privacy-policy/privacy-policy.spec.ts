/**
 * @fileoverview Unit tests for the PrivacyPolicy component.
 * Verifies that the current static title and section headings are rendered.
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
      providers: [provideRouter([])],
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
   * @test Verifies that the component renders the current English title.
   */
  it('should render the Privacy Policy title', () => {
    const titleElement = fixture.debugElement.query(
      By.css('.privacy-policy-page__title'),
    ).nativeElement;

    expect(titleElement.textContent.trim()).toBe('Privacy Policy');
  });

  /**
   * @test Verifies the current privacy policy section headings.
   */
  it('should render all privacy policy section headings', () => {
    const sectionHeaders = fixture.debugElement.queryAll(
      By.css('.privacy-policy-page__section h2'),
    );
    const headings = sectionHeaders.map(({ nativeElement }) =>
      nativeElement.textContent.trim(),
    );

    expect(headings).toEqual([
      '1. Privacy at a Glance',
      '2. Hosting',
      '3. General Information and Mandatory Notices',
      '4. Data Collection on This Website',
    ]);
  });
});