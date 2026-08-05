import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrivacyPolicy } from './privacy-policy';

let component: PrivacyPolicy;
let fixture: ComponentFixture<PrivacyPolicy>;

/** Creates and renders a privacy-policy fixture. */
async function setupComponent(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [PrivacyPolicy],
    providers: [provideRouter([])],
  }).compileComponents();
  fixture = TestBed.createComponent(PrivacyPolicy);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

/** Verifies successful component creation. */
function shouldCreateComponent(): void {
  expect(component).toBeTruthy();
}

/** Verifies the rendered privacy-policy title. */
function shouldRenderTitle(): void {
  const title = fixture.debugElement.query(By.css('.privacy-policy-page__title'))
    .nativeElement as HTMLElement;
  expect(title.textContent?.trim()).toBe('Privacy Policy');
}

/** Verifies the rendered privacy-policy section headings. */
function shouldRenderSectionHeadings(): void {
  const headers = fixture.debugElement.queryAll(By.css('.privacy-policy-page__section h2'));
  const headings = headers.map((header) => {
    return (header.nativeElement as HTMLElement).textContent?.trim();
  });
  expect(headings).toEqual([
    '1. Privacy at a Glance',
    '2. Hosting',
    '3. General Information and Mandatory Notices',
    '4. Data Collection on This Website',
  ]);
}

/** Registers all privacy-policy component tests. */
function registerPrivacyPolicyTests(): void {
  beforeEach(setupComponent);
  it('should create the PrivacyPolicy component', shouldCreateComponent);
  it('should render the Privacy Policy title', shouldRenderTitle);
  it('should render all privacy policy section headings', shouldRenderSectionHeadings);
}

describe('PrivacyPolicy Component', registerPrivacyPolicyTests);