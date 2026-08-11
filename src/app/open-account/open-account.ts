import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-open-account',
  imports: [],
  templateUrl: './open-account.html',
  styleUrl: './open-account.scss',
})
export class OpenAccount {

  count = signal(0);

  isEven = computed(() => this.count() % 2 === 0);

  increment() {
    this.count.set(this.count() + 1);
  }

  decrement() {
    this.count.set(this.count() - 1);
  }

}
