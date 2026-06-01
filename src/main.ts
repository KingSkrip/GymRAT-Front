import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';

document.documentElement.classList.add('dark');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
