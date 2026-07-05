import { Component } from '@angular/core';
import { ContactList } from "../../components/contact-list/contact-list";

@Component({
  selector: 'app-contacts',
  imports: [ContactList],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}
