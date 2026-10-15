// Lien partagé d'une offre : /o/<code> → aperçu de l'offre, puis l'appli.
import { relais } from '../_partage.js';

export function onRequestGet(context) {
  return relais(context, 'pack');
}
