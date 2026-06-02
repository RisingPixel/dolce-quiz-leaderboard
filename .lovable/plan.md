## Modifiche QR code nella leaderboard

### Obiettivo
Rendere il QR code più grande e duplicarlo a sinistra su desktop.

### Cosa cambia in `src/routes/index.tsx`

1. **Ingrandire il QR**
   - Aumentare `width` e `height` dell'immagine QR da `144` a circa `200`.

2. **Duplicare il QR a sinistra su desktop**
   - Sostituire il singolo QR fisso a destra con un layout a 3 colonne: QR sinistra (visibile solo da `md` in su), leaderboard centrale, QR destra.
   - Il QR sinistro deve essere un duplicato identico (stessa immagine, stessa label "Scan to play").
   - Su mobile/tablet (`< md`) il layout rimane come adesso: leaderboard a tutta larghezza e un solo QR in basso a destra.

### Note tecniche
- Utilizzare le utility responsive di Tailwind (`hidden md:flex`) per nascondere/mostrare il QR sinistro.
- Mantenere lo stile attuale: sfondo bianco, ombra, bordo arrotondato, label "Scan to play" in `font-display`.
- L'ordine dei tre blocchi sarà: `[QR sinistro] [Leaderboard] [QR destro]` su desktop.
- Il pannello leaderboard e i QR devono rimanere visibili solo in modalità `leaderboard` (il wrapper di opacità attuale resta invariato).