import { Service, signal } from '@angular/core';

@Service()
export class ThemeService {

    readonly darkMode = signal(false);

    constructor() {
        const dark = localStorage.getItem('theme') === 'dark';

        this.darkMode.set(dark);

        document.body.classList.toggle('dark-theme', dark);
    }

    toggleTheme() {
        const dark = !this.darkMode();

        this.darkMode.set(dark);

        document.body.classList.toggle('dark-theme', dark);

        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }
}