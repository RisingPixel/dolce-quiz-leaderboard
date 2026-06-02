Ho testato la preview desktop a 1920×1080 e il motivo è chiaro: la classifica riceve 13 righe dal backend, ma tutte e 13 entrano già nel riquadro visibile. Il codice avvia l’animazione solo quando c’è overflow verticale (`scrollDistance < 0`), quindi attualmente non parte perché non c’è nulla da far scorrere.

Piano di intervento:

1. Limitare visivamente il riquadro classifica a circa 10 righe su desktop
   - Mantengo almeno 10 nomi visibili come richiesto.
   - Le righe oltre la decima andranno fuori dal riquadro e creeranno overflow reale.

2. Rendere l’auto-scroll dipendente da `data.length > 10`
   - Se ci sono 10 o meno partecipanti, niente animazione.
   - Se ci sono più di 10 partecipanti, la lista scorre automaticamente su e giù.

3. Calcolare lo scroll in modo affidabile
   - Uso le misure reali del contenuto e del contenitore.
   - Mantengo `ResizeObserver`, ma faccio in modo che il contenitore abbia un’altezza stabile, così `scrollHeight - clientHeight` produce una distanza positiva quando ci sono più di 10 righe.

4. Verificare in preview
   - Test desktop 1920×1080: devono vedersi 10 righe circa e la classifica deve muoversi verticalmente.
   - Controllo anche che il timer leaderboard/video resti invariato: classifica 20s, video 15s.