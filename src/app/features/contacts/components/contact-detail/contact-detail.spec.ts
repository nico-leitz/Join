import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { ContactDetail } from './contact-detail';
import { ContactService } from '../../../../core/services/contact.service';
import { Contact } from '../../../../core/models/contact.model';

/**
 * @description Unit tests for the ContactDetail component.
 * This suite verifies the display logic, mobile menu toggling, and event emissions.
 */
describe('ContactDetail', () => {
  let component: ContactDetail;
  let fixture: ComponentFixture<ContactDetail>;
  let mockContactService: any;

  /** 
   * Array of 5 mock contacts to simulate the data coming from the backend/service. 
   */
  const MOCK_CONTACTS: Contact[] = [
    {
      id: '1',
      authUserId: 'user-001',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      phone: '123-456-7890',
      badgeColor: '#ff0000',
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z',
    },
    {
      id: '2',
      authUserId: 'user-002',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.j@example.com',
      phone: null,
      badgeColor: '#00ff00',
      createdAt: '2023-02-15T09:30:00Z',
      updatedAt: '2023-02-15T09:30:00Z',
    },
    {
      id: '3',
      authUserId: 'user-003',
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie.b@example.com',
      phone: '555-0192',
      badgeColor: '#0000ff',
      createdAt: '2023-03-20T14:15:00Z',
      updatedAt: '2023-03-20T14:15:00Z',
    },
    {
      id: '4',
      authUserId: 'user-004',
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana@amazon.com',
      phone: '987-654-3210',
      badgeColor: '#ff00ff',
      createdAt: '2023-04-10T11:00:00Z',
      updatedAt: '2023-04-10T11:00:00Z',
    },
    {
      id: '5',
      authUserId: 'user-005',
      firstName: 'Evan',
      lastName: 'Wright',
      email: 'evan.wright@test.org',
      phone: null,
      badgeColor: '#ffff00',
      createdAt: '2023-05-05T08:45:00Z',
      updatedAt: '2023-05-05T08:45:00Z',
    }
  ];

  beforeEach(async () => {
    // 1. Create a simple mock object for the ContactService
    mockContactService = {
      selectedContact: signal<Contact | null>(MOCK_CONTACTS[0]),
      allContacts: signal<Contact[]>(MOCK_CONTACTS),
      getInitials: vi.fn().mockReturnValue('AS'),
      deleteContact: vi.fn().mockResolvedValue(undefined),
    };

    // 2. Configure the TestBed
    await TestBed.configureTestingModule({
      imports: [ContactDetail],
      providers: [
        { provide: ContactService, useValue: mockContactService }
      ]
    }).compileComponents();

    // 3. Setup fake timers so we can test the setTimeout in the mobile menu animation
    vi.useFakeTimers();

    fixture = TestBed.createComponent(ContactDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  /**
   * @test Checks if the component successfully initializes.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * @test Verifies that the getInitials method correctly calls the service logic.
   */
  it('should call the contact service to get initials', () => {
    const initials = component.getInitials('Alice', 'Smith');
    
    expect(mockContactService.getInitials).toHaveBeenCalledWith('Alice', 'Smith');
    expect(initials).toBe('AS');
  });

  /**
   * @test Ensures that clicking the edit button emits the contact to the parent.
   */
  it('should emit the contact when openEditDialog is called', () => {
    const emitSpy = vi.spyOn(component.editContactRequested, 'emit');
    
    component.openEditDialog(MOCK_CONTACTS[0]);
    
    expect(emitSpy).toHaveBeenCalledWith(MOCK_CONTACTS[0]);
  });

  /**
   * @test Tests the mobile menu toggle logic to ensure it opens when closed.
   */
  it('should open the mobile menu if it is currently closed', () => {
    // Ensure it starts closed
    component.isMobileActionMenuOpen.set(false);
    
    component.toggleMobileActionMenu();
    
    expect(component.isMobileActionMenuOpen()).toBe(true);
    expect(component.isMobileActionMenuClosing()).toBe(false);
  });

  /**
   * @test Tests the closing animation logic of the mobile menu.
   * Uses fake timers to simulate the 180ms delay.
   */
  it('should start closing animation and then close the mobile menu', () => {
    // Open the menu first
    component.isMobileActionMenuOpen.set(true);
    
    component.closeMobileActionMenu();
    
    // Immediately after calling, it should be in the "closing" state
    expect(component.isMobileActionMenuClosing()).toBe(true);
    expect(component.isMobileActionMenuOpen()).toBe(true);
    
    // Fast-forward time by 180 milliseconds
    vi.advanceTimersByTime(180);
    
    // After the timeout, both states should be false
    expect(component.isMobileActionMenuClosing()).toBe(false);
    expect(component.isMobileActionMenuOpen()).toBe(false);
  });

  /**
   * @test Verifies that the mobile menu can be closed immediately without delay.
   */
  it('should close the mobile menu immediately without animation', () => {
    component.isMobileActionMenuOpen.set(true);
    component.isMobileActionMenuClosing.set(true);
    
    component.closeMobileActionMenuImmediately();
    
    expect(component.isMobileActionMenuOpen()).toBe(false);
    expect(component.isMobileActionMenuClosing()).toBe(false);
  });

  /**
   * @test Checks if the edit action from the mobile menu closes the menu and emits the event.
   */
  it('should close mobile menu and emit edit event when editing from mobile menu', () => {
    const editSpy = vi.spyOn(component.editContactRequested, 'emit');
    const closeSpy = vi.spyOn(component, 'closeMobileActionMenuImmediately');
    
    component.editFromMobileMenu(MOCK_CONTACTS[1]);
    
    expect(closeSpy).toHaveBeenCalled();
    expect(editSpy).toHaveBeenCalledWith(MOCK_CONTACTS[1]);
  });

  /**
   * @test Ensures that the goBack function clears the selected contact and emits the back event.
   */
  it('should close menu, clear selected contact, and emit back event when goBack is called', () => {
    const backEmitSpy = vi.spyOn(component.backRequested, 'emit');
    const closeSpy = vi.spyOn(component, 'closeMobileActionMenuImmediately');
    
    component.goBack();
    
    expect(closeSpy).toHaveBeenCalled();
    expect(mockContactService.selectedContact()).toBeNull();
    expect(backEmitSpy).toHaveBeenCalled();
  });

  /**
   * @test Verifies that deleting a contact calls the service, waits for it, and then navigates back.
   */
  it('should call delete on service and navigate back when deleting a contact', async () => {
    const goBackSpy = vi.spyOn(component, 'goBack');
    
    await component.deleteContact('1');
    
    expect(mockContactService.deleteContact).toHaveBeenCalledWith('1');
    expect(goBackSpy).toHaveBeenCalled();
  });
});