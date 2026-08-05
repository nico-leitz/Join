import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { Login } from "./login";
import { AuthService } from "../../../../core/services/auth.service";

/**
 * @description Unit tests for the Login component.
 * This suite verifies reactive form validation, input normalization,
 * user/guest authentication flows, and dynamic error state clearing.
 */
describe("Login Component", () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let mockAuthService: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    Reflect.set(Login, "hasShownSplash", false);

    mockAuthService = {
      isLoading: signal(false),
      errorMessage: signal(""),
      clearError: vi.fn(),
      signIn: vi.fn(),
      signInAsGuest: vi.fn(),
      queueSummaryGreeting: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true as any);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
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
   * @test Ensures the splash animation ends at the rendered header logo.
   */
  it("should use the rendered header logo as splash target", () => {
    const logo = fixture.nativeElement.querySelector(
      ".login-page__logo img",
    ) as HTMLImageElement;

    vi.spyOn(logo, "getBoundingClientRect").mockReturnValue({
      top: 24,
      left: 16,
      width: 64,
    } as DOMRect);

    component.onHeaderLogoLoad();

    expect(component.splashTarget()).toEqual({
      top: "24px",
      left: "16px",
      width: "64px",
    });
  });

  /**
   * @test Ensures the initial centered state renders before movement begins.
   */
  it("should start and finish the splash animation with separate states", () => {
    expect(component.splashAnimating()).toBe(false);

    component.onHeaderLogoLoad();
    vi.advanceTimersByTime(80);
    fixture.detectChanges();

    const splash = fixture.nativeElement.querySelector(".login-splash");

    expect(component.splashAnimating()).toBe(true);
    expect(splash.classList.contains("login-splash--animating")).toBe(true);

    vi.advanceTimersByTime(2400);

    expect(component.showSplash()).toBe(false);
  });

  /**
   * @test Verifies that an empty required email field shows the correct validation state.
   */
  it("should invalidate an empty email field", () => {
    const control = component.loginForm.controls.email;
    control.markAsTouched();
    control.setValue("");

    expect(control.invalid).toBe(true);
    expect(control.hasError("required")).toBe(true);
    expect(component.isControlInvalid("email")).toBe(true);
  });

  /**
   * @test Verifies that malformed email addresses are rejected before login.
   */
  it("should invalidate a malformed email address", () => {
    const control = component.loginForm.controls.email;
    control.markAsTouched();
    control.setValue("invalid-email-format");

    expect(control.invalid).toBe(true);
    expect(control.hasError("strictEmail")).toBe(true);
    expect(component.isControlInvalid("email")).toBe(true);
  });

  /**
   * @test Verifies that an address without a dot and top-level domain is rejected.
   */
  it("should invalidate an email without a top-level domain", () => {
    const control = component.loginForm.controls.email;
    control.markAsTouched();
    control.setValue("tester@provider");

    expect(control.invalid).toBe(true);
    expect(control.hasError("strictEmail")).toBe(true);
    expect(component.isControlInvalid("email")).toBe(true);
  });

  /**
   * @test Verifies that a complete address with a valid top-level domain is accepted.
   */
  it("should accept an email with a complete provider domain", () => {
    const control = component.loginForm.controls.email;
    control.setValue("tester@provider.de");

    expect(control.valid).toBe(true);
    expect(control.hasError("strictEmail")).toBe(false);
  });

  /**
   * @test Verifies that an empty password field shows the correct validation state.
   */
  it("should invalidate an empty password field", () => {
    const control = component.loginForm.controls.password;
    control.markAsTouched();
    control.setValue("");

    expect(control.invalid).toBe(true);
    expect(control.hasError("required")).toBe(true);
    expect(component.isControlInvalid("password")).toBe(true);
  });

  /**
   * @test Ensures that submitting an invalid form aborts the login process and marks fields as touched.
   */
  it("should not call signIn when submitting an invalid form", async () => {
    component.loginForm.controls.email.setValue("");
    component.loginForm.controls.password.setValue("");

    await component.onSubmit();

    expect(component.submitted()).toBe(true);
    expect(component.loginForm.touched).toBe(true);
    expect(mockAuthService.signIn).not.toHaveBeenCalled();
  });

  /**
   * @test Verifies that submitting valid credentials normalizes the email and navigates on success.
   */
  it("should normalize credentials, call signIn, and navigate to summary on successful login", async () => {
    mockAuthService.signIn.mockResolvedValue(true);

    component.loginForm.patchValue({
      email: "TestUser@Example.com",
      password: "SecurePassword123",
    });

    await component.onSubmit();

    expect(component.submitted()).toBe(true);
    expect(mockAuthService.signIn).toHaveBeenCalledWith({
      email: "testuser@example.com",
      password: "SecurePassword123",
    });
    expect(mockAuthService.queueSummaryGreeting).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/summary"]);
  });

  /**
   * @test Ensures that a failed login attempt does not trigger router navigation.
   */
  it("should not navigate to summary if user login fails", async () => {
    mockAuthService.signIn.mockResolvedValue(false);

    component.loginForm.patchValue({
      email: "test@example.com",
      password: "wrongpassword",
    });

    await component.onSubmit();

    expect(mockAuthService.signIn).toHaveBeenCalled();
    expect(mockAuthService.queueSummaryGreeting).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  /**
   * @test Verifies the guest login flow, ensuring it triggers the correct service method and navigates on success.
   */
  it("should call signInAsGuest and navigate to summary on success", async () => {
    mockAuthService.signInAsGuest.mockResolvedValue(true);

    await component.onGuestLogin();

    expect(mockAuthService.signInAsGuest).toHaveBeenCalled();
    expect(mockAuthService.queueSummaryGreeting).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/summary"]);
  });

  /**
   * @test Ensures that a failed guest login attempt does not trigger router navigation.
   */
  it("should not navigate to summary if guest login fails", async () => {
    mockAuthService.signInAsGuest.mockResolvedValue(false);

    await component.onGuestLogin();

    expect(mockAuthService.signInAsGuest).toHaveBeenCalled();
    expect(mockAuthService.queueSummaryGreeting).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  /**
   * @test Checks that modifying any form input triggers the clearing of lingering backend error messages.
   */
  it("should clear backend auth errors when form input changes", () => {
    mockAuthService.errorMessage.set("Invalid credentials");

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