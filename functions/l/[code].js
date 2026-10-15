// Lien partagé d'un livre : /l/<code> → aperçu du livre, puis l'appli.
import { relais } from '../_partage.js';

export function onRequestGet(context) {
  return relais(context, 'livre');
}
