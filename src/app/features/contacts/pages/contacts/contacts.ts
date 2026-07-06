import { Component } from '@angular/core';
import { ContactList } from "../../components/contact-list/contact-list";
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-contacts',
  imports: [ContactList, Sidebar],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}
