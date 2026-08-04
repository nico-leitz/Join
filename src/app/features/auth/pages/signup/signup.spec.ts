import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { Signup } from "./signup";
import { AuthService } from "../../../../core/services/auth.service";

/**
 * @description Unit tests for the Signup component.
 * This suite verifies reactive form validation, cross-field password matching,
 * input normalization, direct post-signup navigation, and error state management.
 */
describe("Signup Component", () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let router: Router;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      isLoading: signal(false),
      errorMessage: signal(""),
      clearError: vi.fn(),
      signUp: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true as any);

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test Ensures the component creates successfully and clears any stale auth errors on init.
   */
  it("should create the component and clear auth errors in constructor", () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.clearError).toHaveBeenCalled();
  });

  /**
   * @test Verifies that an empty required name field shows the correct validation state.
   */
  it("should invalidate an empty full name field", () => {
    const control = component.signupForm.controls.fullName;
    control.markAsTouched();
    control.setValue("");

    expect(control.invalid).toBe(true);
    expect(control.hasError("required")).toBe(true);
    expect(component.isControlInvalid("fullName")).toBe(true);
  });

  /**
   * @test Ensures that a name consisting only of whitespace characters is rejected as empty.
   */
  it("should invalidate a full name field containing only whitespace", () => {
    const control = component.signupForm.controls.fullName;
    control.markAsTouched();
    control.setValue("   ");

    expect(control.invalid).toBe(true);
    expect(control.hasError("required")).toBe(true);
    expect(component.isControlInvalid("fullName")).toBe(true);
  });

  /**
   * @test Verifies that names must contain at least six alphabetic characters.
   */
  it("should invalidate a name containing fewer than six letters", () => {
    const control = component.signupForm.controls.fullName;
    control.setValue("Amy Li");

    expect(control.hasError("minLetters")).toBe(true);
  });

  /**
   * @test Verifies that digits and unsupported punctuation are rejected in names.
   */
  it("should invalidate unsupported name characters", () => {
    const control = component.signupForm.controls.fullName;
    control.setValue("John Doe2");

    expect(control.hasError("invalidNameCharacters")).toBe(true);
  });

  /**
   * @test Verifies that international letters, hyphens and apostrophes are supported.
   */
  it("should accept a valid international name with separators", () => {
    const control = component.signupForm.controls.fullName;
    control.setValue("Anne-Marie O'Neill");

    expect(control.valid).toBe(true);
  });

  /**
   * @test Verifies that malformed email structures trigger the strict validator.
   */
  it("should invalidate a malformed email address", () => {
    const control = component.signupForm.controls.email;
    control.markAsTouched();
    control.setValue("invalid-email-format");

    expect(control.invalid).toBe(true);
    expect(control.hasError("strictEmail")).toBe(true);
    expect(component.isControlInvalid("email")).toBe(true);
  });

  /**
   * @test Verifies that a complete provider domain and multi-letter ending are required.
   */
  it.each([
    "user@provider",
    "user@provider.c",
    "user@-provider.com",
    "user@provider-.com",
    "user@provider..com",
  ])("should reject an invalid provider or domain ending: %s", (email) => {
    const control = component.signupForm.controls.email;
    control.setValue(email);

    expect(control.hasError("strictEmail")).toBe(true);
  });

  /**
   * @test Verifies that common local parts, subdomains and valid endings are accepted.
   */
  it("should accept a structurally valid email address", () => {
    const control = component.signupForm.controls.email;
    control.setValue("user.name+tag@sub.provider.co.uk");

    expect(control.valid).toBe(true);
  });

  /**
   * @test Verifies the minimum password length.
   */
  it("should require at least eight password characters", () => {
    const control = component.signupForm.controls.password;
    control.setValue("Pass123");

    expect(control.hasError("minlength")).toBe(true);
  });

  /**
   * @test Verifies that passwords contain an uppercase letter.
   */
  it("should require an uppercase password letter", () => {
    const control = component.signupForm.controls.password;
    control.setValue("password123");

    expect(control.hasError("missingUppercase")).toBe(true);
  });

  /**
   * @test Verifies that passwords contain a number.
   */
  it("should require a number in the password", () => {
    const control = component.signupForm.controls.password;
    control.setValue("PasswordOnly");

    expect(control.hasError("missingNumber")).toBe(true);
  });

  /**
   * @test Verifies that a password satisfying every rule is accepted.
   */
  it("should accept a password satisfying all strength rules", () => {
    const control = component.signupForm.controls.password;
    control.setValue("Password123");

    expect(control.valid).toBe(true);
  });

  /**
   * @test Ensures that the custom password match validator correctly identifies mismatched passwords.
   */
  it("should invalidate the form if passwords do not match", () => {
    component.signupForm.patchValue({
      password: "SecurePassword123",
      confirmPassword: "DifferentPassword456",
    });

    component.signupForm.controls.confirmPassword.markAsTouched();

    expect(component.signupForm.hasError("passwordMismatch")).toBe(true);
    expect(component.hasPasswordMismatch()).toBe(true);
  });

  /**
   * @test Ensures that the custom password match validator resolves correctly when passwords match.
   */
  it("should validate successfully when passwords match", () => {
    component.signupForm.patchValue({
      password: "MatchingPassword123",
      confirmPassword: "MatchingPassword123",
    });

    expect(component.signupForm.hasError("passwordMismatch")).toBe(false);
    expect(component.hasPasswordMismatch()).toBe(false);
  });

  /**
   * @test Verifies that the privacy policy checkbox is strictly required to be true.
   */
  it("should invalidate if privacy policy is not accepted", () => {
    const control = component.signupForm.controls.privacyAccepted;
    control.markAsTouched();
    control.setValue(false);

    expect(control.invalid).toBe(true);
    expect(control.hasError("required")).toBe(true);
    expect(component.isControlInvalid("privacyAccepted")).toBe(true);
  });

  /**
   * @test Ensures that submitting an invalid form aborts the signup process and marks fields as touched.
   */
  it("should not call signUp when submitting an invalid form", async () => {
    component.signupForm.patchValue({
      fullName: "John Doe",
      email: "john@example.com",
    });

    await component.onSubmit();

    expect(component.submitted()).toBe(true);
    expect(component.signupForm.touched).toBe(true);
    expect(mockAuthService.signUp).not.toHaveBeenCalled();
  });

  /**
   * @test Verifies that successful demo registration normalizes credentials and redirects directly to summary.
   */
  it("should normalize credentials and navigate to summary after signup", async () => {
    mockAuthService.signUp.mockResolvedValue(true);

    component.signupForm.patchValue({
      fullName: "  Jane Doe  ",
      email: "Jane.Doe@Example.com",
      password: "SecurePassword123",
      confirmPassword: "SecurePassword123",
      privacyAccepted: true,
    });

    await component.onSubmit();

    expect(mockAuthService.signUp).toHaveBeenCalledWith({
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      password: "SecurePassword123",
      privacyAccepted: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(["/summary"]);
  });

  /**
   * @test Ensures that a failed signup attempt (returning null/falsy) does not trigger router navigation.
   */
  it("should not navigate if signUp fails", async () => {
    mockAuthService.signUp.mockResolvedValue(false);

    component.signupForm.patchValue({
      fullName: "John Doe",
      email: "john@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      privacyAccepted: true,
    });

    await component.onSubmit();

    expect(mockAuthService.signUp).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  /**
   * @test Checks that modifying any form input triggers the clearing of lingering backend error messages.
   */
  it("should clear backend auth errors when form input changes", () => {
    mockAuthService.errorMessage.set("Email already exists");

    component.onFormChange();

    expect(mockAuthService.clearError).toHaveBeenCalled();
  });

  /**
   * @test Ensures that form changes do not unnecessarily call clearError if no error message exists.
   */
  it("should not call clearError on form change if no error message exists", () => {
    mockAuthService.clearError.mockClear();
    mockAuthService.errorMessage.set("");

    component.onFormChange();

    expect(mockAuthService.clearError).not.toHaveBeenCalled();
  });
});