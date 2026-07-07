import { Component } from '@angular/core';
import { ContactList } from "../../components/contact-list/contact-list";
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { ContactDetail } from "../../components/contact-detail/contact-detail";


@Component({
  selector: 'app-contacts',
  imports: [ContactList, Sidebar, ContactDetail],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}