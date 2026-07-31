/**
 * @fileoverview Unit tests for the LegalNotice component.
 * Verifies that the correct localized static texts and sections are rendered.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { LegalNotice } from './legal-notice';

/**
 * @description Test suite for the LegalNotice Component.
 */
describe('LegalNotice Component', () => {
  let component: LegalNotice;
  let fixture: ComponentFixture<LegalNotice>;

  /**
   * @description Sets up the test environment and compiles the component.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNotice],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNotice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * @test Ensures the component creates successfully.
   */
  it('should create the LegalNotice component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that the component renders the localized title "Impressum".
   */
  it('should render the Legal Notice title', () => {
    const titleElement = fixture.debugElement.query(By.css('.legal-notice-page__title')).nativeElement;
    expect(titleElement.textContent.trim()).toBe('Impressum');
  });

  /**
   * @test Checks if the correct number of sections (3) is displayed in the template.
   */
  it('should display the correct number of sections', () => {
    const sectionHeaders = fixture.debugElement.queryAll(By.css('.legal-notice-page__section h2'));
    expect(sectionHeaders.length).toBe(3);
  });
});