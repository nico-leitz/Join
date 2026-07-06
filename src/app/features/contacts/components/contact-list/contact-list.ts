import { Component } from '@angular/core';

interface contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})

export class ContactList {
  contacts: contact[] = [
    { id: 1, firstName: 'Benedikt', lastName: 'Ziegler', email: 'benedikt@gmail.com' },
    { id: 2, firstName: 'Anton', lastName: 'Mayer', email: 'antonm@gmail.com' },
    { id: 3, firstName: 'David', lastName: 'Eisenberg', email: 'davidberg@gmail.com' },
    { id: 4, firstName: 'Anja', lastName: 'Schulz', email: 'schulz@hotmail.com' },
    { id: 5, firstName: 'Eva', lastName: 'Fischer', email: 'eva@gmail.com' },
    { id: 6, firstName: 'Emmanuel', lastName: 'Mauer', email: 'emmanuelma@gmail.com' },
    { id: 7, firstName: 'Marcel', lastName: 'Bauer', email: 'mbauer@web.de' },
    { id: 8, firstName: 'Leon', lastName: 'Wolf', email: 'leon.wolf@gmx.de' },
    { id: 9, firstName: 'Sarah', lastName: 'Wagner', email: 's.wagner@outlook.com' },
    { id: 10, firstName: 'Tobias', lastName: 'Hoffmann', email: 'thoffmann@gmail.com' },
    { id: 11, firstName: 'Julia', lastName: 'Becker', email: 'j.becker@yahoo.com' },
    { id: 12, firstName: 'Maximilian', lastName: 'Koch', email: 'max.koch@gmail.com' },
    { id: 13, firstName: 'Laura', lastName: 'Richter', email: 'laura.r@hotmail.com' },
    { id: 14, firstName: 'Felix', lastName: 'Klein', email: 'f.klein@web.de' },
    { id: 15, firstName: 'Anna', lastName: 'Schröder', email: 'anna.schroeder@gmail.com' },
    { id: 16, firstName: 'Christian', lastName: 'Neumann', email: 'c.neumann@gmx.de' },
    { id: 17, firstName: 'Maria', lastName: 'Schwarz', email: 'mariaschwarz@outlook.com' },
    { id: 18, firstName: 'Lukas', lastName: 'Braun', email: 'lukas.braun@yahoo.com' },
    { id: 19, firstName: 'Sophie', lastName: 'Hofmann', email: 's.hofmann@web.de' },
    { id: 20, firstName: 'Jonas', lastName: 'Schmitt', email: 'jonas.schmitt@gmail.com' },
  ];

  ngOnInit() {
    this.sortContacts();
  }

  sortContacts() {
    this.contacts = [...this.contacts].sort((a, b) => {
      return a.firstName.localeCompare(b.firstName);
    });
  }

  getInitials(firstName: string, lastName: string) {
    if (!firstName || !lastName) return '';

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    return firstInitial + lastInitial;
  }
}
