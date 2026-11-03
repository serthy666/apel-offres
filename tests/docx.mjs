// Fabrique de petits fichiers Word (.docx) : pour les tests, et pour le modèle proposé aux gérants
// (node tests/docx.mjs  →  assets/modele-salon-apel.docx).
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const echapper = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Paragraphe : { style: "Heading1" | "Title" | "Quote" | "", centre: bool, runs: [[texte, "b" | "i" | "bi" | ""]] } ou une simple chaîne.
function paragraphe(p) {
  if (typeof p === "string") p = { runs: [[p, ""]] };
  // saut : nouvelle page avant le paragraphe ; aligne : "center", "right" ou "both" (justifié)
  const jc = p.centre ? "center" : p.aligne || "";
  const ppr = (p.style ? `<w:pStyle w:val="${p.style}"/>` : "") + (p.saut ? "<w:pageBreakBefore/>" : "") + (jc ? `<w:jc w:val="${jc}"/>` : "");
  const runs = (p.runs || []).map(([t, f]) => {
    const rpr = (f && f.includes("b") ? "<w:b/>" : "") + (f && f.includes("i") ? "<w:i/>" : "");
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ""}<w:t xml:space="preserve">${echapper(t)}</w:t></w:r>`;
  }).join("");
  return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${runs}</w:p>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="24"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:after="300"/></w:pPr><w:rPr><w:b/><w:sz w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="480" w:after="240"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720" w:right="720"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
</w:styles>`;

export function fabriquerDocx(paragraphes) {
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paragraphes.map(paragraphe).join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const fichiers = [
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`],
    ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["word/document.xml", document],
    ["word/styles.xml", STYLES]
  ];
  return zip(fichiers.map(([n, t]) => [n, Buffer.from(t, "utf8")]));
}

function zip(entrees) {
  const locaux = [], central = [];
  let decalage = 0;
  for (const [nom, donnees] of entrees) {
    const n = Buffer.from(nom, "utf8"), comp = zlib.deflateRawSync(donnees), crc = zlib.crc32(donnees);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6); l.writeUInt16LE(8, 8);
    l.writeUInt16LE(0, 10); l.writeUInt16LE(0x21, 12); l.writeUInt32LE(crc, 14); l.writeUInt32LE(comp.length, 18); l.writeUInt32LE(donnees.length, 22);
    l.writeUInt16LE(n.length, 26); l.writeUInt16LE(0, 28);
    locaux.push(l, n, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(donnees.length, 24);
    c.writeUInt16LE(n.length, 28); c.writeUInt32LE(decalage, 42);
    central.push(c, n);
    decalage += 30 + n.length + comp.length;
  }
  const tailleCentral = central.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entrees.length, 8); fin.writeUInt16LE(entrees.length, 10);
  fin.writeUInt32LE(tailleCentral, 12); fin.writeUInt32LE(decalage, 16);
  return Buffer.concat([...locaux, ...central, fin]);
}

// Modèle proposé dans l'espace gérant
export const MODELE = [
  { style: "Title", runs: [["Titre du livre", ""]] },
  { centre: true, runs: [["Prénom Nom de l'auteur", "i"]] },
  { runs: [["Mode d'emploi (à effacer) : chaque chapitre commence par une ligne de style « Titre 1 » (onglet Accueil > Styles). Le texte d'avant le premier chapitre n'est pas publié s'il est court. Le gras, l'italique, le centrage, les citations (style « Citation ») et les séparateurs de scène (* * *) sont gardés. Enregistrez en .docx, puis importez le fichier dans l'Espace gérant > Livres à lire.", "b"]] },
  { style: "Heading1", runs: [["Chapitre 1 : Le titre du premier chapitre", ""]] },
  "Écrivez ou collez ici le texte du premier chapitre. Chaque paragraphe de Word devient un paragraphe dans la liseuse du Salon de lecture.",
  { runs: [["Un mot en ", ""], ["italique", "i"], [" ou en ", ""], ["gras", "b"], [" garde sa mise en forme.", ""]] },
  { style: "Quote", runs: [["« Une lettre, un poème ou une pensée du personnage peut prendre le style Citation. »", ""]] },
  { centre: true, runs: [["* * *", ""]] },
  "Après un séparateur de scène, l'histoire reprend.",
  { style: "Heading1", runs: [["Chapitre 2 : Le titre du deuxième chapitre", ""]] },
  "Texte du deuxième chapitre…",
  { style: "Heading1", runs: [["Chapitre 3 : Le titre du troisième chapitre", ""]] },
  "Texte du troisième chapitre…"
];

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const cible = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/modele-salon-apel.docx");
  fs.writeFileSync(cible, fabriquerDocx(MODELE));
  console.log("Modèle écrit : " + cible);
}
