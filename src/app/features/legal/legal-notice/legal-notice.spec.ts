import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LegalNotice } from './legal-notice';

let component: LegalNotice;
let fixture: ComponentFixture<LegalNotice>;

/** Creates and renders a legal-notice fixture. */
async function setupComponent(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [LegalNotice],
    providers: [provideRouter([])],
  }).compileComponents();
  fixture = TestBed.createComponent(LegalNotice);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies the rendered legal-notice title. */
function shouldRenderTitle(): void {
  const title = fixture.debugElement.query(By.css('.legal-notice-page__title'))
    .nativeElement as HTMLElement;
  expect(title.textContent?.trim()).toBe('Imprint');
}

/** Verifies the rendered legal-notice section headings. */
function shouldRenderSectionHeadings(): void {
  const headers = fixture.debugElement.queryAll(By.css('.legal-notice-page__section h2'));
  const headings = headers.map((header) => {
    return (header.nativeElement as HTMLElement).textContent?.trim();
  });
  expect(headings).toEqual([
    'Information in accordance with Section 5 TMG',
    'Contact',
    'Project Notice',
  ]);
}

/** Registers all legal-notice component tests. */
function registerLegalNoticeTests(): void {
  beforeEach(setupComponent);
  it('should create the LegalNotice component', shouldCreateComponent);
  it('should render the Legal Notice title', shouldRenderTitle);
  it('should render all legal notice section headings', shouldRenderSectionHeadings);
}

describe('LegalNotice Component', registerLegalNoticeTests);