import './style.css';
import { Game } from './core/Game';

const host = document.querySelector<HTMLElement>('#app');
if (!host) throw new Error('Application mount point not found');
new Game(host);
