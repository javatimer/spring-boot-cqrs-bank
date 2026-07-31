import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-open-account',
  imports: [],
  templateUrl: './open-account.html',
  styleUrl: './open-account.scss',
})
export class OpenAccount {
  holder = signal('');
  accountType = signal('SAVINGS');
  openingBalance = signal(0);
}
