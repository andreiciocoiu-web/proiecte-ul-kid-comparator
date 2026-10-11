# Atlas KID

Compară produse de asigurare de viață **unit-linked** din România după documentele KID (PRIIPs).

Chestionarul de risc (orizont, obiectiv, SRI, capacitate de pierdere, acoperiri, modul de plată, sensibilitate la cost) schimbă clasamentul. Scorul ține cont de costul anual (RIY), comisionul de intrare, scenariul moderat la perioada recomandată și acoperirile cerute.

Cifrele vin din KID-urile publice ale asigurătorilor. Nu este o recomandare de cumpărare: scenariile nu sunt randamente promise, iar prima reală depinde de vârstă, sumă și fond.

## Pornire

```bash
npm install
npm run dev
```

Aplicația ascultă pe portul 8080.

```bash
npm run typecheck
npm run build
```

## Ce conține

- **Clasament** — produse ordonate pe profil, cu RIY, comision, scenariu moderat și motivul locului.
- **Documente** — verificare a paginilor de KID și extragere de text din PDF.
- **Raport** — rezumat de tipărit și legătură către folderul Google Drive „KID Unit-Linked RO”, când aplicația rulează din Grok cu conectorul Drive.
