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
    {
    id: 1,
    firstName: "Test",
    lastName: "Testermann",
    email: "Test@testmail.de"
    },
    {
    id: 2,
    firstName: "Test2",
    lastName: "Testermann2",
    email: "Test@testmail2.de"
    }

  ] 
}
